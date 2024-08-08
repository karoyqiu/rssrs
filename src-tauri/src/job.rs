use anyhow::Result;
use reqwest::Proxy;
use rss::Channel;
use rusqlite::Connection;
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

async fn fetch(proxy: &ProxySettings, seed: &Seed) -> Result<()> {
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
  println!("{}: {:?}", &seed.name, channel);

  Ok(())
}

pub async fn check_seeds(config: &Config) -> Result<()> {
  // 读取代理设置和种子
  let (proxy, seeds) = get_data(config)?;
  println!("Proxy: {:?}", &proxy);

  for seed in seeds {
    if seed.should_fetch() {
      // 抓取
      fetch(&proxy, &seed).await?;
    }
  }

  Ok(())
}
