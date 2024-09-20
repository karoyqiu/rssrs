use anyhow::Result;
use chrono::Local;
use log::{debug, info, warn};
use rusqlite::{params, Connection};
use serde::Deserialize;
use specta::Type;
use tauri::{AppHandle, Manager};

use crate::{
  adapter::{Adapter, RssAdapter},
  app_handle::get_app_handle,
  db::{get_all_seeds, initialize, DbAccess},
  events::SeedUnreadCountEvent,
  seed::{Article, Seed},
};

/// 代理设置
#[derive(Debug, Deserialize)]
pub struct ProxySettings {
  #[serde(rename = "type")]
  pub t: String,
  pub host: String,
  pub port: u16,
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

fn insert_articles(app_handle: &AppHandle, seed_id: i64, articles: &Vec<Article>) -> Result<()> {
  debug!("Articles: {:#?}", articles);
  app_handle.db_mut(|db| -> Result<()> {
    let tx = db.transaction()?;
    let mut total = 0;

    {
      let mut stmt = tx.prepare("INSERT OR IGNORE INTO articles (seed_id, guid, title, author, desc, link, pub_date, unread) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")?;

      for article in articles {
        let inserted = stmt.execute(params![
          seed_id,
          article.guid,
          article.title,
          article.author,
          article.desc,
          article.link,
          article.pub_date,
          article.unread,
        ])?;

        total += inserted;
      }
    }

    tx.commit()?;

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
  })
}

fn save_last_fetch(app_handle: &AppHandle, seed_id: i64, ok: bool) -> Result<()> {
  info!("Fetched {}: {}", seed_id, ok);
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
    let adapters = vec![RssAdapter::default()];

    for seed in seeds {
      if seed.should_fetch() {
        // 抓取
        let mut fetched = false;

        for adapter in &adapters {
          if adapter.is_supported(&seed.url) {
            info!("Fetching {} ({})", &seed.name, seed.id);
            fetched = true;

            match adapter.fetch(&proxy, &generic, &seed).await {
              Ok(articles) => {
                insert_articles(&app_handle, seed.id, &articles)?;
                save_last_fetch(&app_handle, seed.id, true)?;
              }

              Err(err) => {
                warn!("Failed to fetch {}: {:?}", &seed.name, err);
                save_last_fetch(&app_handle, seed.id, false)?;
              }
            }
          }
        }

        if !fetched {
          warn!("No adapter for seed {}", &seed.name);
        }
      }
    }
  }

  Ok(())
}
