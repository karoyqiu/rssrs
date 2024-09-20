use chrono::Local;
use serde::{Deserialize, Serialize};
use specta::Type;

/// 种子
#[derive(Debug, Deserialize, Serialize, Type)]
pub struct Seed {
  /// ID
  pub id: i64,
  /** 名称 */
  pub name: String,
  /** URL */
  pub url: String,
  /**
   * 图标
   *
   * TODO: 保存 URL 或 base64，估计是后者
   */
  pub favicon: Option<String>,
  /** 更新周期，分钟 */
  pub interval: i32,
  /** 最近抓取时间，UNIX Epoch */
  pub last_fetched_at: i64,
  /** 最近抓取是否成功 */
  pub last_fetch_ok: bool,
}

impl Seed {
  /// 是否应该抓取
  pub fn should_fetch(&self) -> bool {
    if self.last_fetched_at > 0 {
      // 上次抓取过了，计算下次抓取时间
      let next_fetch = self.last_fetched_at + i64::from(self.interval * 60);
      let now = Local::now().timestamp();

      // 如果下次抓取时间还没到，则不该抓取
      if next_fetch > now {
        return false;
      }
    }

    // 可
    true
  }
}

/// 文章
#[derive(Debug, Deserialize, Serialize, Type)]
pub struct Article {
  /// ID
  pub id: i64,
  /// 种子 ID
  pub seed_id: i64,
  /// 种子名称
  pub seed_name: String,
  /// GUID
  pub guid: String,
  /// 标题
  pub title: Option<String>,
  /// 作者
  pub author: Option<String>,
  /// 描述
  pub desc: Option<String>,
  /// 链接
  pub link: Option<String>,
  /// 发布时间，UNIX Epoch
  pub pub_date: i64,
  /// 是否未读
  pub unread: bool,
}
