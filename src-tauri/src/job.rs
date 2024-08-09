use anyhow::Result;
use chrono::{DateTime, Local};
use log::info;
use reqwest::Proxy;
use rss::{Channel, Item};
use rusqlite::{params, Connection};
use serde::Deserialize;
use tauri::{AppHandle, Manager};

use crate::{
  app_handle::get_app_handle,
  db::{get_all_seeds, initialize},
  events::SeedUnreadCountEvent,
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

fn get_data(app_handle: &AppHandle) -> Result<(ProxySettings, Vec<Seed>)> {
  // 打开数据库
  let db = initialize(app_handle, true)?;

  let proxy = get_proxy(&db)?;
  let seeds = get_all_seeds(&db)?;

  Ok((proxy, seeds))
}

fn insert_items(app_handle: &AppHandle, seed_id: i64, items: &Vec<Item>) -> Result<()> {
  let db = initialize(app_handle, false)?;
  let mut stmt = db.prepare("INSERT OR IGNORE INTO items (seed_id, guid, title, author, desc, link, pub_date, unread) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")?;
  let mut total = 0;

  for item in items {
    let guid = if let Some(guid) = &item.guid {
      Some(guid.value.clone())
    } else {
      None
    };

    if let Some(date) = &item.pub_date {
      let date = DateTime::parse_from_rfc2822(date.as_str())?;
      let date = date.timestamp();
      let inserted = stmt.execute(params![
        seed_id,
        guid,
        item.title,
        item.author,
        item.description,
        item.link,
        date,
        true,
      ])?;
      total += inserted;
    };
  }

  if total > 0 {
    info!("{total} new articles");
    app_handle
      .emit_all(
        "app://seed/new",
        SeedUnreadCountEvent {
          id: Some(seed_id),
          unread_count: total as i32,
        },
      )
      .unwrap();
    app_handle
      .emit_all(
        "app://seed/new",
        SeedUnreadCountEvent {
          id: None,
          unread_count: total as i32,
        },
      )
      .unwrap();
  }

  Ok(())
}

async fn fetch(app_handle: &AppHandle, proxy: &ProxySettings, seed: &Seed) -> Result<()> {
  info!("Fetching {}", &seed.name);
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
  insert_items(app_handle, seed.id, &channel.items)?;

  info!("Fetched {}", &seed.name);
  Ok(())
}

fn save_last_fetch(app_handle: &AppHandle, seed_id: i64, ok: bool) -> Result<()> {
  let db = initialize(app_handle, false)?;
  let mut stmt =
    db.prepare("UPDATE seeds SET last_fetched_at = ?2, last_fetch_ok = ?3 WHERE id = ?1")?;
  stmt.execute(params![seed_id, Local::now().timestamp(), ok])?;
  Ok(())
}

pub async fn check_seeds() -> Result<()> {
  if let Some(app_handle) = get_app_handle() {
    // 读取代理设置和种子
    let (proxy, seeds) = get_data(&app_handle)?;

    for seed in seeds {
      if seed.should_fetch() {
        // 抓取
        let result = fetch(&app_handle, &proxy, &seed).await;
        save_last_fetch(&app_handle, seed.id, result.is_ok())?;
      }
    }
  }

  Ok(())
}
