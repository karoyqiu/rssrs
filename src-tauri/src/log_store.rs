use std::{
  collections::VecDeque,
  sync::{LazyLock, Mutex},
};

use chrono::Local;
use log::{Level, LevelFilter, Log, Metadata, Record};
use serde::Serialize;
use specta::Type;

#[derive(Clone, Serialize, Type)]
pub struct LogEntry {
  pub id: u64,
  pub timestamp: String,
  pub level: String,
  pub message: String,
}

#[derive(Default)]
pub struct LogStore {
  entries: VecDeque<LogEntry>,
  next_id: u64,
}

impl LogStore {
  pub fn record(&mut self, level: Level, message: String) {
    if level <= Level::Info {
      if self.entries.len() == 1000 {
        self.entries.pop_front();
      }
      self.next_id += 1;
      self.entries.push_back(LogEntry {
        id: self.next_id,
        timestamp: Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        level: level.to_string(),
        message,
      });
    }
  }

  pub fn entries(&self) -> Vec<LogEntry> {
    self.entries.iter().cloned().collect()
  }
}

static STORE: LazyLock<Mutex<LogStore>> = LazyLock::new(|| Mutex::new(LogStore::default()));

struct Logger {
  console: env_logger::Logger,
}

impl Log for Logger {
  fn enabled(&self, metadata: &Metadata<'_>) -> bool {
    metadata.level() <= Level::Info || self.console.enabled(metadata)
  }

  fn log(&self, record: &Record<'_>) {
    self.console.log(record);
    if record.level() <= Level::Info {
      let message = record.args().to_string();
      STORE.lock().unwrap().record(record.level(), message);
    }
  }

  fn flush(&self) {
    self.console.flush();
  }
}

pub fn init() {
  let console = env_logger::Logger::from_default_env();
  let max_level = console.filter().max(LevelFilter::Info);
  log::set_boxed_logger(Box::new(Logger { console })).expect("Failed to initialize logger");
  log::set_max_level(max_level);
}

#[tauri::command]
#[specta::specta]
pub fn get_logs() -> Vec<LogEntry> {
  STORE.lock().unwrap().entries()
}

#[cfg(test)]
mod tests {
  use super::LogStore;
  use log::Level;

  #[test]
  fn records_local_timestamp_level_and_message() {
    let mut store = LogStore::default();
    let before = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    store.record(Level::Warn, "Failed to fetch Foo: timeout".into());
    let after = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let entries = store.entries();
    let entry = &entries[0];
    assert_eq!(entry.timestamp.len(), 19);
    assert!(entry.timestamp >= before && entry.timestamp <= after);
    assert_eq!(entry.level, "WARN");
    assert_eq!(entry.message, "Failed to fetch Foo: timeout");
  }

  #[test]
  fn returns_entries_in_insertion_order_with_increasing_ids() {
    let mut store = LogStore::default();
    store.record(Level::Info, "first".into());
    store.record(Level::Warn, "second".into());
    store.record(Level::Error, "third".into());
    let entries = store.entries();
    let messages: Vec<_> = entries.iter().map(|entry| entry.message.as_str()).collect();
    assert_eq!(messages, ["first", "second", "third"]);
    assert!(entries.windows(2).all(|pair| pair[0].id < pair[1].id));
  }

  #[test]
  fn keeps_the_newest_1000_entries_in_insertion_order() {
    let mut store = LogStore::default();
    for index in 0..1002 {
      store.record(Level::Info, index.to_string());
    }
    let entries = store.entries();
    assert_eq!(entries.len(), 1000);
    assert_eq!(entries.first().unwrap().message, "2");
    assert_eq!(entries.last().unwrap().message, "1001");
    assert!(entries.windows(2).all(|pair| {
      pair[1].message.parse::<usize>().unwrap() == pair[0].message.parse::<usize>().unwrap() + 1
    }));
  }

  #[test]
  fn stores_only_info_and_above() {
    let mut store = LogStore::default();
    for level in [
      Level::Trace,
      Level::Debug,
      Level::Info,
      Level::Warn,
      Level::Error,
    ] {
      store.record(level, "message".into());
    }
    let levels: Vec<_> = store
      .entries()
      .iter()
      .map(|entry| entry.level.clone())
      .collect();
    assert_eq!(levels, ["INFO", "WARN", "ERROR"]);
  }
}
