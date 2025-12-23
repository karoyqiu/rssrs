use anyhow::Result;
use base64::{Engine as _, engine::general_purpose::STANDARD};
use chrono::{DateTime, Days, Local};
use log::{debug, info, warn};
use reqwest::{
  Proxy,
  header::{CONTENT_TYPE, REFERER},
};
use rss::{Channel, Item};
use rusqlite::{Connection, params};
use serde::Deserialize;
use specta::Type;
use tauri::AppHandle;
use tauri_specta::Event;

use crate::{
  app_handle::get_app_handle,
  db::{DbAccess, get_all_seeds, get_seed, initialize, update_tray_tooltip},
  error::IntoResult,
  events::SeedNewEvent,
  seed::Seed,
};

/// 代理设置
#[derive(Debug, Deserialize)]
struct ProxySettings {
  #[serde(rename = "type")]
  t: String,
  host: String,
  port: u16,
}

/// 一般设置
#[derive(Debug, Deserialize, Type)]
pub struct GenericSettings {
  /// 请求超时时间，秒
  pub timeout: u32,
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

fn get_generic_settings(db: &Connection) -> Result<GenericSettings> {
  let mut stmt = db.prepare("SELECT value FROM settings WHERE key = ?1")?;
  let mut rows = stmt.query(["generic"])?;

  if let Some(row) = rows.next()? {
    let value: String = row.get("value")?;
    let proxy: GenericSettings = serde_json::from_str(value.as_str())?;
    Ok(proxy)
  } else {
    Ok(GenericSettings { timeout: 30 })
  }
}

fn get_data(app_handle: &AppHandle) -> Result<(ProxySettings, GenericSettings, Vec<Seed>)> {
  // 打开数据库
  let db = initialize(app_handle, true)?;

  let proxy = get_proxy(&db)?;
  let generic = get_generic_settings(&db)?;
  let seeds = get_all_seeds(&db)?;

  #[cfg(debug_assertions)]
  debug!("Settings: {:?}, {:?}", &proxy, &generic);

  Ok((proxy, generic, seeds))
}

fn insert_items(app_handle: &AppHandle, seed_id: i64, items: &Vec<Item>) -> Result<()> {
  app_handle.db_mut(|db| -> Result<()> {
    let tx = db.transaction()?;
    let mut total = 0;

    let seed = get_seed(&tx, seed_id)?;

    {
      let mut stmt = tx.prepare("INSERT OR IGNORE INTO articles (seed_id, guid, title, author, desc, link, pub_date, unread) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")?;
      let now = Local::now();
      let deadline = {
        let mut days = seed.reserved_in_days.unwrap_or(30);
        let mut deadline = now.checked_sub_days(Days::new(days)).unwrap();
        let first = items.first().unwrap();

        if let Some(date) = &first.pub_date {
          let date = DateTime::parse_from_rfc2822(date.as_str())?;

          while date < deadline {
            days += 30;
            deadline = deadline.checked_sub_days(Days::new(days)).unwrap();
          }
        }

        if seed.reserved_in_days != Some(days) {
          let mut stmt = tx.prepare("UPDATE seeds SET reserved_in_days = ?2 WHERE id = ?1")?;
          stmt.execute(params![seed_id, days])?;
        }

        deadline
      };

      for item in items {
        let guid = if let Some(guid) = &item.guid {
          Some(guid.value.clone())
        } else {
          None
        };

        if let Some(date) = &item.pub_date {
          let date = DateTime::parse_from_rfc2822(date.as_str())?;

          if date > deadline {
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
          }
        }
      }
    }

    if total > 0 {
      info!("{total} new articles");

      if total == items.len() && seed.interval > 8 {
        let mut stmt = tx.prepare("UPDATE seeds SET interval = ?2 WHERE id = ?1")?;
        stmt.execute(params![seed_id, 8])?;
      }

      SeedNewEvent {
        id: Some(seed_id),
        unread_count: total as i32,
      }.emit(app_handle)?;

      SeedNewEvent {
        id: None,
        unread_count: total as i32,
      }.emit(app_handle)?;
    } else {
      info!("No new article");

      if seed.interval < 1024 {
        let mut stmt = tx.prepare("UPDATE seeds SET interval = ?2 WHERE id = ?1")?;
        stmt.execute(params![seed_id, seed.interval * 2])?;
      }
    }

    tx.commit()?;
    Ok(())
  })
}

async fn fetch(
  app_handle: &AppHandle,
  proxy: &ProxySettings,
  generic: &GenericSettings,
  seed: &Seed,
) -> Result<()> {
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

  let client = client
    .timeout(std::time::Duration::from_secs(generic.timeout.into()))
    .build()?;
  let content = client.get(&seed.url).send().await?.bytes().await?;

  #[cfg(debug_assertions)]
  {
    let s = String::from_utf8(content.to_vec())?;
    log::trace!("Fetched {}, {}", &seed.name, s);
  }

  let channel = Channel::read_from(&content[..])?;

  if !channel.items.is_empty() {
    debug!("First item {:?}", &channel.items[0]);
    insert_items(app_handle, seed.id, &channel.items)?;
  } else {
    warn!("Empty channel");
  }

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
    let (proxy, generic, seeds) = get_data(&app_handle)?;

    for seed in seeds {
      if seed.should_fetch() {
        // 抓取
        if let Err(err) = fetch(&app_handle, &proxy, &generic, &seed).await {
          warn!("Failed to fetch {}: {:?}", &seed.name, err);
          save_last_fetch(&app_handle, seed.id, false)?;
        } else {
          save_last_fetch(&app_handle, seed.id, true)?;
        }
      }
    }

    // 更新托盘图标工具提示
    update_tray_tooltip(&app_handle)?;
  }

  Ok(())
}

/// 下载指定 URL 的数据
#[tauri::command]
#[specta::specta]
pub async fn download(
  app_handle: AppHandle,
  url: String,
  referer: Option<String>,
) -> crate::error::Result<String> {
  debug!("Downloading {}", &url);
  let proxy = app_handle.db(|db| -> Result<ProxySettings> { get_proxy(db) })?;
  let mut client = reqwest::Client::builder();

  match proxy.t.as_str() {
    "none" => {
      client = client.no_proxy();
    }
    "http" => {
      client =
        client.proxy(Proxy::all(format!("http://{}:{}", proxy.host, proxy.port)).into_result()?);
    }
    _ => {}
  }

  let client = client
    .timeout(std::time::Duration::from_secs(30))
    .build()
    .into_result()?;
  let mut request = client.get(url);

  if let Some(referer) = referer {
    request = request.header(REFERER, referer);
  }

  let response = request.send().await.into_result()?;
  let content_type = {
    let value = response.headers().get(CONTENT_TYPE);

    if let Some(value) = value {
      String::from(value.to_str().into_result()?)
    } else {
      String::from("image/jpeg")
    }
  };
  let body = response.bytes().await.into_result()?;
  let encoded = STANDARD.encode(&body);
  Ok(format!("data:{};base64,{}", content_type, encoded))
}
