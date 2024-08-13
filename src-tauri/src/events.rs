use serde::{Deserialize, Serialize};
use specta::Type;

/// 文章未读事件
#[derive(Debug, Clone, Deserialize, Serialize, Type)]
pub struct ArticleReadEvent {
  /// 文章 ID
  pub id: i64,
  /// 是否未读
  pub unread: bool,
}

/// 种子未读数量事件
#[derive(Debug, Clone, Deserialize, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SeedUnreadCountEvent {
  /// 种子 ID
  pub id: Option<i64>,
  /// 未读数量
  pub unread_count: i32,
}
