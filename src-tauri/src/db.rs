use chrono::{DateTime, Local};
use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Manager, State};

const CURRENT_DB_VERSION: u32 = 2;

pub struct AppState {
  pub db: std::sync::Mutex<Option<Connection>>,
}

pub trait DbAccess {
  fn db<F, TResult>(&self, operation: F) -> TResult
  where
    F: FnOnce(&Connection) -> TResult;

  fn db_mut<F, TResult>(&self, operation: F) -> TResult
  where
    F: FnOnce(&mut Connection) -> TResult;
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

  fn db_mut<F, TResult>(&self, operation: F) -> TResult
  where
    F: FnOnce(&mut Connection) -> TResult,
  {
    let app_state: State<AppState> = self.state();
    let mut db_connection_guard = app_state.db.lock().unwrap();
    let db = db_connection_guard.as_mut().unwrap();

    operation(db)
  }
}

pub fn initialize(app_handle: &AppHandle) -> Result<Connection> {
  let app_dir = app_handle
    .path_resolver()
    .app_data_dir()
    .expect("The app data directory should exist.");
  std::fs::create_dir_all(&app_dir).expect("The app data directory should be created.");
  let sqlite_path = app_dir.join("rssrs.db");

  let mut db = Connection::open(sqlite_path)?;

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

#[derive(Debug, Deserialize, Serialize, Type)]
/// 种子
pub struct Seed {
  /// ID
  id: i64,
  /** 名称 */
  name: String,
  /** URL */
  url: String,
  /**
   * 图标
   *
   * TODO: 保存 URL 或 base64，估计是后者
   */
  favicon: Option<String>,
  /** 更新周期，分钟 */
  interval: i32,
  /** 最近抓取时间 */
  last_fetched_at: Option<DateTime<Local>>,
  /** 最近抓取是否成功 */
  last_fetch_ok: Option<bool>,
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

/// 获取所有种子。
#[tauri::command]
#[specta::specta]
pub async fn db_get_all_seeds(app_handle: AppHandle) -> Vec<Seed> {
  let result = app_handle.db(|db| -> Result<Vec<Seed>> {
    let mut stmt = db.prepare("SELECT * FROM seeds")?;
    let mut rows = stmt.query([])?;
    let mut items = Vec::new();

    while let Some(row) = rows.next()? {
      let ts: Option<i64> = row.get("last_fetched_at")?;

      items.push(Seed {
        id: row.get("id")?,
        name: row.get("name")?,
        url: row.get("url")?,
        favicon: row.get("favicon")?,
        interval: row.get("interval")?,
        last_fetched_at: if let Some(ts) = ts {
          Some(DateTime::from(DateTime::from_timestamp(ts, 0).unwrap()))
        } else {
          None
        },
        last_fetch_ok: row.get("last_fetch_ok")?,
      });
    }

    Ok(items)
  });

  if let Ok(items) = result {
    items
  } else {
    vec![]
  }
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
