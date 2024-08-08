use std::path::PathBuf;

use rusqlite::{params, Connection, OpenFlags, Result, Row};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Manager, State};

use crate::seed::{Seed, SeedItem};

const CURRENT_DB_VERSION: u32 = 3;

pub struct AppState {
  pub db: std::sync::Mutex<Option<Connection>>,
}

pub trait DbAccess {
  fn db<F, TResult>(&self, operation: F) -> TResult
  where
    F: FnOnce(&Connection) -> TResult;

  // fn db_mut<F, TResult>(&self, operation: F) -> TResult
  // where
  //   F: FnOnce(&mut Connection) -> TResult;
}

impl DbAccess for AppHandle {
  fn db<F, TResult>(&self, operation: F) -> TResult
  where
    F: FnOnce(&Connection) -> TResult,
  {
    let app_state: State<AppState> = self.state();
    let db_connection_guard = app_state.db.lock().unwrap();
    let db = db_connection_guard.as_ref().unwrap();

    operation(db)
  }

  // fn db_mut<F, TResult>(&self, operation: F) -> TResult
  // where
  //   F: FnOnce(&mut Connection) -> TResult,
  // {
  //   let app_state: State<AppState> = self.state();
  //   let mut db_connection_guard = app_state.db.lock().unwrap();
  //   let db = db_connection_guard.as_mut().unwrap();

  //   operation(db)
  // }
}

pub fn initialize(app_dir: Option<PathBuf>, readonly: bool) -> Result<Connection> {
  let app_dir = app_dir.expect("The app data directory should exist.");
  std::fs::create_dir_all(&app_dir).expect("The app data directory should be created.");
  let sqlite_path = app_dir.join("rssrs.db");

  let flags = if readonly {
    OpenFlags::SQLITE_OPEN_READ_ONLY
  } else {
    OpenFlags::default()
  };
  let mut db = Connection::open_with_flags(sqlite_path, flags)?;

  let mut user_pragma = db.prepare("PRAGMA user_version")?;
  let existing_user_version: u32 = user_pragma.query_row([], |row| Ok(row.get(0)?))?;
  drop(user_pragma);

  db.execute("PRAGMA foreign_keys = ON", [])?;
  upgrade_if_needed(&mut db, existing_user_version)?;

  Ok(db)
}

/// Upgrades the database to the current version.
fn upgrade_if_needed(db: &mut Connection, existing_version: u32) -> Result<()> {
  if existing_version < CURRENT_DB_VERSION {
    db.pragma_update(None, "journal_mode", "WAL")?;

    let tx = db.transaction()?;

    tx.pragma_update(None, "user_version", CURRENT_DB_VERSION)?;

    tx.execute_batch(
      "
      CREATE TABLE IF NOT EXISTS seeds (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        url TEXT NOT NULL UNIQUE,
        favicon TEXT,
        interval INTEGER,
        last_fetched_at INTEGER,
        last_fetch_ok INTEGER
      );
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY,
        seed_id INTEGER REFERENCES seeds (id) ON DELETE CASCADE ON UPDATE CASCADE,
        guid TEXT NOT NULL UNIQUE,
        title TEXT,
        author TEXT,
        desc TEXT,
        link TEXT,
        pub_date INTEGER,
        unread INTEGER
      );
      CREATE INDEX IF NOT EXISTS items_pub_date ON items (pub_date DESC);
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      ",
    )?;

    tx.commit()?;
  }

  Ok(())
}

/// 插入种子。
#[tauri::command]
#[specta::specta]
pub async fn db_insert_seed(app_handle: AppHandle, name: String, url: String) -> bool {
  let result = app_handle.db(|db| -> Result<()> {
    let mut stmt = db.prepare("INSERT INTO seeds (name, url, interval) VALUES (?1, ?2, 10)")?;
    stmt.execute([name, url])?;
    Ok(())
  });

  result.is_ok()
}

/// 将行转换为 Seed
fn to_seed(row: &Row) -> Result<Seed> {
  Ok(Seed {
    id: row.get("id")?,
    name: row.get("name")?,
    url: row.get("url")?,
    favicon: row.get("favicon")?,
    interval: row.get("interval")?,
    last_fetched_at: row.get("last_fetched_at")?,
    last_fetch_ok: row.get("last_fetch_ok")?,
  })
}

/// 获取所有种子。
pub fn get_all_seeds(db: &Connection) -> Result<Vec<Seed>> {
  let mut stmt = db.prepare("SELECT * FROM seeds")?;
  let mut rows = stmt.query([])?;
  let mut items = Vec::new();

  while let Some(row) = rows.next()? {
    items.push(to_seed(row)?);
  }

  Ok(items)
}

/// 获取所有种子。
#[tauri::command]
#[specta::specta]
pub async fn db_get_all_seeds(app_handle: AppHandle) -> Vec<Seed> {
  let result = app_handle.db(get_all_seeds);

  if let Ok(items) = result {
    items
  } else {
    vec![]
  }
}

#[derive(Debug, Deserialize, Serialize, Type)]
pub struct ItemFilters {
  pub seed_id: Option<i64>,
  pub cursor: Option<String>,
  pub limit: Option<usize>,
}

#[derive(Debug, Deserialize, Serialize, Type)]
pub struct ItemResult {
  items: Vec<SeedItem>,
  next_cursor: Option<String>,
}

/// 获取项。
#[tauri::command]
#[specta::specta]
pub async fn db_get_items(app_handle: AppHandle, filters: ItemFilters) -> ItemResult {
  let result = app_handle.db(move |db| -> Result<ItemResult> {
    let sql = String::from("SELECT * FROM items WHERE pub_date <= ?1 AND id >= ?2 ORDER BY pub_date DESC, id ASC LIMIT ?3");
    let mut pub_date = i64::MAX;
    let mut id = 0i64;
    let limit = filters.limit.unwrap_or(20);

    if let Some(cursor) = filters.cursor {
      // cursor 格式：pub_date:id
      let splitted: Vec<&str> = cursor.split(':').collect();
      pub_date = splitted[0].parse().unwrap_or(i64::MAX);
      id = splitted[1].parse().unwrap_or(0);
    }

    let mut stmt = db.prepare(&sql)?;
    let mut rows = stmt.query(params![pub_date, id, limit + 1])?;
    let mut items = Vec::new();

    while let Some(row) = rows.next()? {
      items.push(SeedItem {
        id: row.get("id")?,
        seed_id: row.get("seed_id")?,
        title: row.get("title")?,
        author: row.get("author")?,
        desc: row.get("desc")?,
        link: row.get("link")?,
        pub_date: row.get("pub_date")?,
        unread: row.get("unread")?,
      });
    }

    let next_cursor = if items.len() > limit {
      let last = items.pop().unwrap();
      Some(format!("{}:{}", last.pub_date.unwrap_or(0), last.id))
    } else {
      None
    };

    Ok(ItemResult{ items, next_cursor })
  });

  result.unwrap()
  // if let Ok(result) = result {
  //   result
  // } else {
  //   ItemResult {
  //     items: vec![],
  //     next_cursor: None,
  //   }
  // }
}

/// 获取设置。
#[tauri::command]
#[specta::specta]
pub async fn db_get_setting(app_handle: AppHandle, key: String) -> String {
  let result = app_handle.db(|db| -> Result<String> {
    let mut stmt = db.prepare("SELECT value FROM settings WHERE key = ?1")?;
    let mut rows = stmt.query([key])?;

    if let Some(row) = rows.next()? {
      let value: String = row.get("value")?;
      Ok(value)
    } else {
      Ok(String::default())
    }
  });

  if let Ok(value) = result {
    value
  } else {
    String::default()
  }
}

/// 修改设置。
#[tauri::command]
#[specta::specta]
pub async fn db_set_setting(app_handle: AppHandle, key: String, value: String) -> bool {
  let result = app_handle.db(|db| -> Result<()> {
    let mut stmt = db.prepare("REPLACE INTO settings (key, value) VALUES (?1, ?2)")?;
    stmt.execute([key, value])?;
    Ok(())
  });

  result.is_ok()
}
