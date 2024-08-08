use anyhow::Result;
use chrono::{DateTime, Local};
use reqwest::Proxy;
use rss::{Channel, Item};
use rusqlite::{params, Connection};
use serde::Deserialize;
use tauri::{api::path::app_data_dir, Config};

use crate::{
  db::{get_all_seeds, initialize},
  seed::Seed,
};

#[derive(Debug, Deserialize)]
struct ProxySettings {
  #[serde(rename = "type")]
  t: String,
  host: String,
  port: u16,
}

/// 获取代理设置
fn get_proxy(db: &Connection) -> Result<ProxySettings> {
  let mut stmt = db.prepare("SELECT value FROM settings WHERE key = ?1")?;
  let mut rows = stmt.query(["proxy"])?;

  if let Some(row) = rows.next()? {
    let value: String = row.get("value")?;
    let proxy: ProxySettings = serde_json::from_str(value.as_str())?;
    Ok(proxy)
  } else {
    Ok(ProxySettings {
      t: String::from("sys"),
      host: String::default(),
      port: 0,
    })
  }
}

fn get_data(config: &Config) -> Result<(ProxySettings, Vec<Seed>)> {
  // 打开数据库
  let app_dir = app_data_dir(config);
  let db = initialize(app_dir, true)?;

  let proxy = get_proxy(&db)?;
  let seeds = get_all_seeds(&db)?;

  Ok((proxy, seeds))
}

fn insert_items(config: &Config, seed_id: i64, items: &Vec<Item>) -> Result<()> {
  let app_dir = app_data_dir(config);
  let db = initialize(app_dir, false)?;
  let mut stmt = db.prepare("INSERT OR IGNORE INTO items (seed_id, guid, title, author, desc, link, pub_date, unread) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")?;

  for item in items {
    let guid = if let Some(guid) = &item.guid {
      Some(guid.value.clone())
    } else {
      None
    };

    if let Some(date) = &item.pub_date {
      let date = DateTime::parse_from_rfc2822(date.as_str())?;
      stmt.execute(params![
        seed_id,
        guid,
        item.title,
        item.author,
        item.description,
        item.link,
        date,
        true,
      ])?;
    };
  }

  Ok(())
}

async fn fetch(config: &Config, proxy: &ProxySettings, seed: &Seed) -> Result<()> {
  println!("Fetching {}", &seed.name);
  let mut client = reqwest::Client::builder();

  match proxy.t.as_str() {
    "none" => {
      client = client.no_proxy();
    }
    "http" => {
      client = client.proxy(Proxy::all(format!("http://{}:{}", proxy.host, proxy.port))?);
    }
    _ => {}
  }

  let client = client.build()?;
  let content = client.get(&seed.url).send().await?.bytes().await?;
  let channel = Channel::read_from(&content[..])?;
  insert_items(config, seed.id, &channel.items)?;

  println!("Fetched {}", &seed.name);
  Ok(())
}

fn save_last_fetch(config: &Config, seed_id: i64, ok: bool) -> Result<()> {
  let app_dir = app_data_dir(config);
  let db = initialize(app_dir, false)?;
  let mut stmt =
    db.prepare("UPDATE seeds SET last_fetched_at = ?2, last_fetch_ok = ?3 WHERE id = ?1")?;
  stmt.execute(params![seed_id, Local::now().timestamp(), ok])?;
  Ok(())
}

pub async fn check_seeds(config: &Config) -> Result<()> {
  // 读取代理设置和种子
  let (proxy, seeds) = get_data(config)?;

  for seed in seeds {
    if seed.should_fetch() {
      // 抓取
      let result = fetch(config, &proxy, &seed).await;
      save_last_fetch(config, seed.id, result.is_ok())?;
    }
  }

  Ok(())
}
