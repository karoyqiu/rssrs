use std::vec;

use chrono::{Days, Local};
use log::info;
use rusqlite::types::Value;
use rusqlite::{params, params_from_iter, Connection, OpenFlags, Result, Row};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::image::Image;
use tauri::{AppHandle, Manager, State};
use tauri_specta::Event;

use crate::app_handle::get_app_handle;
use crate::events::{ArticleReadEvent, SeedAddEvent, SeedUnreadCountEvent, WatchlistChangeEvent};
use crate::seed::{Article, Seed};

const CURRENT_DB_VERSION: u32 = 6;

#[derive(Default)]
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

pub fn initialize(app_handle: &AppHandle, readonly: bool) -> Result<Connection> {
  let app_dir = app_handle
    .path()
    .app_data_dir()
    .expect("The app data directory should exist.");
  std::fs::create_dir_all(&app_dir).expect("The app data directory should be created.");
  let sqlite_path = app_dir.join("rssrs.db");

  let flags = if readonly {
    OpenFlags::SQLITE_OPEN_READ_ONLY
  } else {
    OpenFlags::default()
  };
  let mut db = Connection::open_with_flags(sqlite_path, flags)?;
  db.pragma_update(None, "journal_mode", "WAL")?;
  db.pragma_update(None, "journal_size_limit", "6144000")?;
  db.pragma_update(None, "synchronous", "NORMAL")?;
  db.pragma_update(None, "foreign_keys", "ON")?;

  if !readonly {
    db.pragma_update(None, "optimize", 0x10002)?;
  }

  let mut user_pragma = db.prepare("PRAGMA user_version")?;
  let existing_user_version: u32 = user_pragma.query_row([], |row| Ok(row.get(0)?))?;
  drop(user_pragma);

  upgrade_if_needed(&mut db, existing_user_version)?;

  Ok(db)
}

/// Upgrades the database to the current version.
fn upgrade_if_needed(db: &mut Connection, existing_version: u32) -> Result<()> {
  if existing_version < CURRENT_DB_VERSION {
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
        last_fetch_ok INTEGER,
        reserved_in_days INTEGER
      );
      ALTER TABLE seeds ADD COLUMN rank INTEGER;
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY,
        seed_id INTEGER NOT NULL REFERENCES seeds (id) ON DELETE CASCADE ON UPDATE CASCADE,
        guid TEXT NOT NULL UNIQUE,
        title TEXT,
        author TEXT,
        desc TEXT,
        link TEXT,
        pub_date INTEGER NOT NULL,
        unread INTEGER
      );
      CREATE INDEX IF NOT EXISTS articles_pub_date ON articles (pub_date DESC);
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS watch_list (
        id INTEGER PRIMARY KEY,
        keyword TEXT NOT NULL UNIQUE
      );
      PRAGMA optimize;
      ",
    )?;

    tx.commit()?;
  }

  Ok(())
}

/// 执行数据库优化
pub fn optimize() {
  let app_handle = get_app_handle();

  if let Some(app_handle) = app_handle {
    let _ = app_handle.db_mut(|db| -> Result<()> {
      let now = Local::now();
      let seeds = get_all_seeds(db)?;

      let tx = db.transaction()?;

      for seed in seeds {
        let deadline = now
          .checked_sub_days(Days::new(seed.reserved_in_days.unwrap_or(30)))
          .unwrap()
          .timestamp();
        tx.execute(
          "DELETE FROM articles WHERE seed_id = ?1 AND unread = ?2 AND pub_date < ?3",
          [seed.id, 0, deadline],
        )?;
      }

      tx.commit()?;

      db.execute_batch("PRAGMA optimize; VACUUM; PRAGMA wal_checkpoint(truncate);")?;
      Ok(())
    });
  }
}

/// 插入种子。
#[tauri::command]
#[specta::specta]
pub async fn db_insert_seed(app_handle: AppHandle, name: String, url: String) -> bool {
  let result = app_handle.db(|db| -> Result<()> {
    let mut stmt = db.prepare("INSERT INTO seeds (name, url, interval, last_fetched_at, last_fetch_ok) VALUES (?1, ?2, 8, 0, 0)")?;
    stmt.execute([name, url])?;

    SeedAddEvent {}.emit(&app_handle).unwrap();

    Ok(())
  });

  result.is_ok()
}

/// 更新种子。
#[tauri::command]
#[specta::specta]
pub async fn db_update_seed(
  app_handle: AppHandle,
  seed_id: i64,
  name: String,
  url: String,
) -> bool {
  let result = app_handle.db(|db| -> Result<()> {
    let mut stmt = db.prepare("UPDATE seeds SET name = ?1, url = ?2 WHERE id = ?3")?;
    stmt.execute(params![name, url, seed_id])?;

    SeedAddEvent {}.emit(&app_handle).unwrap();

    Ok(())
  });

  result.is_ok()
}

/// 更新种子排序。
#[tauri::command]
#[specta::specta]
pub async fn db_update_seed_rank(
  app_handle: AppHandle,
  seed_id: i64,
  rank: i32,
) -> bool {
  let result = app_handle.db(|db| -> Result<()> {
    let mut stmt = db.prepare("UPDATE seeds SET rank = ?2 WHERE id = ?1")?;
    stmt.execute(params![seed_id, rank])?;

    SeedAddEvent {}.emit(&app_handle).unwrap();

    Ok(())
  });

  result.is_ok()
}

/// 删除种子。
#[tauri::command]
#[specta::specta]
pub async fn db_delete_seed(app_handle: AppHandle, seed_id: i64) -> bool {
  let result = app_handle.db(|db| -> Result<()> {
    let mut stmt = db.prepare("DELETE FROM seeds WHERE id = ?1")?;
    stmt.execute(params![seed_id])?;

    SeedAddEvent {}.emit(&app_handle).unwrap();

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
    reserved_in_days: row.get("reserved_in_days")?,
    rank: row.get("rank")?,
  })
}

/// 获取所有种子。
pub fn get_all_seeds(db: &Connection) -> Result<Vec<Seed>> {
  let mut stmt = db.prepare("SELECT * FROM seeds ORDER BY rank")?;
  let mut rows = stmt.query([])?;
  let mut items = Vec::new();

  while let Some(row) = rows.next()? {
    items.push(to_seed(row)?);
  }

  Ok(items)
}

pub fn get_seed(db: &Connection, id: i64) -> Result<Seed> {
  let mut stmt = db.prepare("SELECT * FROM seeds WHERE id = ?1")?;
  let mut rows = stmt.query([id])?;
  let row = rows.next()?;
  let row = row.unwrap();
  to_seed(row)
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

fn get_unread_count(db: &Connection, seed_id: Option<i64>) -> Result<i32> {
  let (sql, params) = if let Some(seed_id) = seed_id {
    (
      "SELECT COUNT(*) FROM articles WHERE seed_id = ?1 AND unread != 0",
      [seed_id],
    )
  } else {
    (
      "SELECT COUNT(*) FROM articles WHERE seed_id != ?1 AND unread != 0",
      [0],
    )
  };

  let mut stmt = db.prepare(sql)?;
  let mut rows = stmt.query(params)?;

  if let Some(row) = rows.next()? {
    Ok(row.get(0)?)
  } else {
    Ok(0)
  }
}

/// 获取未读数量。
#[tauri::command]
#[specta::specta]
pub fn db_get_unread_count(app_handle: AppHandle, seed_id: Option<i64>) -> i32 {
  let result = app_handle.db(|db| -> Result<i32> { get_unread_count(db, seed_id) });

  result.unwrap()

  // if let Ok(result) = result {
  //   result
  // } else {
  //   Ok(0)
  // }
}

/// 将行转换为 Seed
fn to_article(row: &Row) -> Result<Article> {
  Ok(Article {
    id: row.get("id")?,
    seed_id: row.get("seed_id")?,
    seed_name: row.get("name")?,
    title: row.get("title")?,
    author: row.get("author")?,
    desc: row.get("desc")?,
    link: row.get("link")?,
    pub_date: row.get("pub_date")?,
    unread: row.get("unread")?,
  })
}

fn get_article(db: &Connection, id: i64) -> Result<Article> {
  let mut stmt = db.prepare("SELECT articles.*, seeds.name FROM articles LEFT JOIN seeds ON articles.seed_id = seeds.id WHERE articles.id = ?1")?;
  let mut rows = stmt.query([id])?;
  let row = rows.next()?;
  let row = row.unwrap();
  to_article(row)
}

#[derive(Debug, Deserialize, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ArticleFilters {
  pub seed_id: Option<i64>,
  pub cursor: Option<String>,
  pub limit: Option<i32>,
  pub search: Option<String>,
  pub unread_only: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ArticleResult {
  articles: Vec<Article>,
  next_cursor: Option<String>,
}

fn get_articles_with(
  db: &Connection,
  filters: &ArticleFilters,
  query: &Option<String>,
  mut params: Vec<Value>,
) -> Result<ArticleResult> {
  let mut pub_date = i64::MAX;
  let mut id = 0i64;
  let limit = filters.limit.unwrap_or(20);
  let unread_only = filters.unread_only.unwrap_or(true);

  if let Some(cursor) = &filters.cursor {
    // cursor 格式：pub_date:id
    let splitted: Vec<&str> = cursor.split(':').collect();
    pub_date = splitted[0].parse().unwrap_or(i64::MAX);
    id = splitted[1].parse().unwrap_or(0);
  }

  params.insert(0, (limit + 1).into());
  params.insert(0, Value::Integer(if unread_only { 0 } else { -1 })); // unread
  params.insert(0, Value::Integer(id));
  params.insert(0, Value::Integer(pub_date));

  let mut query = if let Some(q) = query {
    format!("AND ({})", q)
  } else {
    String::default()
  };

  if let Some(search) = &filters.search {
    if !search.is_empty() {
      let search_query = format!(" AND instr(title, ?{}) > 0", params.len() + 1);
      query.push_str(&search_query);
      params.push(Value::Text(search.to_owned()));
    }
  }

  let sql = format!("SELECT articles.*, seeds.name FROM articles LEFT JOIN seeds ON articles.seed_id = seeds.id WHERE (pub_date < ?1 OR (pub_date = ?1 AND articles.id >= ?2)) AND unread != ?3 {} ORDER BY pub_date DESC, articles.id ASC LIMIT ?4", query);
  let mut stmt = db.prepare(&sql)?;

  log::trace!("SQL: {}", &sql);
  log::trace!("PARAMS: {:?}", &params);

  let mut rows = stmt.query(params_from_iter(params))?;
  let mut articles = Vec::new();

  while let Some(row) = rows.next()? {
    articles.push(to_article(row)?);
  }

  let next_cursor = if articles.len() > limit as usize {
    let last = articles.pop().unwrap();
    Some(format!("{}:{}", last.pub_date, last.id))
  } else {
    None
  };

  Ok(ArticleResult {
    articles,
    next_cursor,
  })
}

fn get_watched_articles(db: &Connection, filters: &ArticleFilters) -> Result<ArticleResult> {
  let keywords = get_watch_list(db)?;

  if keywords.is_empty() {
    return Ok(ArticleResult {
      articles: vec![],
      next_cursor: None,
    });
  }

  let mut conds = Vec::new();

  for n in 0..keywords.len() {
    conds.push(format!("instr(title, ?{}) > 0", n + 5));
  }

  let mut params: Vec<Value> = Vec::new();

  for keyword in keywords {
    params.push(keyword.into());
  }

  get_articles_with(db, filters, &Some(conds.join(" OR ")), params)
}

fn get_articles(db: &Connection, filters: &ArticleFilters) -> Result<ArticleResult> {
  let (query, params) = if let Some(seed_id) = filters.seed_id {
    (
      Some(String::from("seed_id = ?5")),
      vec![Value::Integer(seed_id)],
    )
  } else {
    (None, vec![])
  };

  get_articles_with(db, filters, &query, params)
}

/// 获取文章。
#[tauri::command]
#[specta::specta]
pub async fn db_get_articles(app_handle: AppHandle, filters: ArticleFilters) -> ArticleResult {
  let result = app_handle.db(|db| -> Result<ArticleResult> {
    if let Some(seed_id) = filters.seed_id {
      if seed_id < 0 {
        return get_watched_articles(db, &filters);
      }
    }

    get_articles(db, &filters)
  });

  result.unwrap()

  // if let Ok(result) = result {
  //   result
  // } else {
  //   ItemResult {
  //     articles: vec![],
  //     next_cursor: None,
  //   }
  // }
}

/// 将文章标记为已读或未读。
#[tauri::command]
#[specta::specta]
pub async fn db_read_article(app_handle: AppHandle, item_id: i64, read: bool) -> bool {
  info!("Mark as read: {item_id}, {read}");

  let result = app_handle.db(|db| -> Result<()> {
    let mut stmt = db.prepare("UPDATE articles SET unread = ?2 WHERE id = ?1")?;
    stmt.execute(params![item_id, !read])?;

    // 上报种子未读数量事件
    let article = get_article(db, item_id)?;
    let unread_count = get_unread_count(db, Some(article.seed_id))?;
    SeedUnreadCountEvent {
      id: Some(article.seed_id),
      unread_count,
    }
    .emit(&app_handle)
    .unwrap();

    let unread_count = get_unread_count(db, None)?;
    SeedUnreadCountEvent {
      id: None,
      unread_count,
    }
    .emit(&app_handle)
    .unwrap();

    // 上报文章已读事件
    ArticleReadEvent {
      id: item_id,
      unread: !read,
    }
    .emit(&app_handle)
    .unwrap();

    Ok(())
  });

  result.unwrap();

  update_tray_tooltip(&app_handle).unwrap();
  true
}

/// 全部标记为已读
#[tauri::command]
#[specta::specta]
pub async fn db_read_all(app_handle: AppHandle, seed_id: Option<i64>) -> bool {
  let sid = seed_id.unwrap_or_default();
  info!("Read all: {sid}");

  let result = app_handle.db(|db| -> Result<()> {
    let (sql, params) = if sid > 0 {
      (
        "UPDATE articles SET unread = ?1 WHERE seed_id = ?2",
        vec![0, sid],
      )
    } else {
      ("UPDATE articles SET unread = ?1", vec![0])
    };

    let mut stmt = db.prepare(sql)?;
    stmt.execute(params_from_iter(params))?;

    // 上报种子未读数量事件
    SeedUnreadCountEvent {
      id: seed_id,
      unread_count: 0,
    }
    .emit(&app_handle)
    .unwrap();

    SeedUnreadCountEvent {
      id: None,
      unread_count: if sid > 0 {
        get_unread_count(db, None)?
      } else {
        0
      },
    }
    .emit(&app_handle)
    .unwrap();

    ArticleReadEvent {
      id: -1,
      unread: false,
    }
    .emit(&app_handle)
    .unwrap();

    Ok(())
  });

  result.unwrap();

  update_tray_tooltip(&app_handle).unwrap();
  true
}

fn get_watch_list(db: &Connection) -> Result<Vec<String>> {
  let mut stmt = db.prepare("SELECT keyword FROM watch_list")?;
  let mut rows = stmt.query([])?;
  let mut items = Vec::new();

  while let Some(row) = rows.next()? {
    let keyword: String = row.get(0)?;
    items.push(keyword);
  }

  Ok(items)
}

/// 获取监视关键字列表。
#[tauri::command]
#[specta::specta]
pub async fn db_get_watch_list(app_handle: AppHandle) -> Vec<String> {
  let result = app_handle.db(get_watch_list);

  result.unwrap()

  // if let Ok(result) = result {
  //   result
  // } else {
  //   vec![]
  // }
}

/// 添加监视关键字。
#[tauri::command]
#[specta::specta]
pub async fn db_add_watch_keyword(app_handle: AppHandle, keyword: String) -> bool {
  let result = app_handle.db(|db| -> Result<()> {
    let mut stmt = db.prepare("INSERT INTO watch_list (keyword) VALUES (?1)")?;
    stmt.execute([keyword])?;
    Ok(())
  });

  result.unwrap();

  WatchlistChangeEvent {}.emit(&app_handle).unwrap();

  true

  // result.is_ok()
}

/// 删除监视关键字。
#[tauri::command]
#[specta::specta]
pub async fn db_delete_watch_keyword(app_handle: AppHandle, keyword: String) -> bool {
  let result = app_handle.db(|db| -> Result<()> {
    let mut stmt = db.prepare("DELETE FROM watch_list WHERE keyword = ?1")?;
    stmt.execute([keyword])?;
    Ok(())
  });

  result.unwrap();

  WatchlistChangeEvent {}.emit(&app_handle).unwrap();

  true

  // result.is_ok()
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

/// 更新托盘图标工具提示
pub fn update_tray_tooltip(app_handle: &AppHandle) -> anyhow::Result<()> {
  if let Some(tray) = app_handle.tray_by_id("main") {
    let unread = db_get_unread_count(app_handle.clone(), None);
    let title = if cfg!(debug_assertions) {
      "RSS Dev"
    } else {
      "RSS"
    };

    let (title, icon) = if unread > 0 {
      let img = Image::from_bytes(include_bytes!("../icons/16x16Dot.png"))?;
      (format!("{} ({} unread articles)", title, unread), img)
    } else {
      let img = app_handle.default_window_icon().unwrap().clone();
      (title.to_string(), img)
    };

    tray.set_tooltip(Some(&title))?;
    tray.set_title(Some(title))?;
    tray.set_icon(Some(icon))?;
  }

  Ok(())
}
