use chrono::{DateTime, Duration, Local};
use serde::{Deserialize, Serialize};
use specta::Type;

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
  /** 最近抓取时间 */
  pub last_fetched_at: Option<DateTime<Local>>,
  /** 最近抓取是否成功 */
  pub last_fetch_ok: Option<bool>,
}

impl Seed {
  /// 是否应该抓取
  pub fn should_fetch(&self) -> bool {
    if let Some(last_fetched_at) = self.last_fetched_at {
      // 上次抓取过了，计算下次抓取时间
      let next_fetch = last_fetched_at + Duration::minutes(self.interval.into());
      let now = Local::now();

      // 如果下次抓取时间还没到，则不该抓取
      if next_fetch > now {
        return false;
      }
    }

    // 可
    true
  }
}
