use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;

/// 种子添加事件
#[derive(Debug, Clone, Copy, Deserialize, Serialize, Type, Event)]
pub struct SeedAddEvent;

/// 关注列表修改事件
#[derive(Debug, Clone, Copy, Deserialize, Serialize, Type, Event)]
pub struct WatchlistChangeEvent;

/// 文章未读事件
#[derive(Debug, Clone, Deserialize, Serialize, Type, Event)]
pub struct ArticleReadEvent {
  /// 文章 ID
  pub id: i64,
  /// 是否未读
  pub unread: bool,
}

/// 新种子事件
#[derive(Debug, Clone, Deserialize, Serialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct SeedNewEvent {
  /// 种子 ID
  pub id: Option<i64>,
  /// 未读数量
  pub unread_count: i32,
}

/// 种子未读数量事件
#[derive(Debug, Clone, Deserialize, Serialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct SeedUnreadCountEvent {
  /// 种子 ID
  pub id: Option<i64>,
  /// 未读数量
  pub unread_count: i32,
}
