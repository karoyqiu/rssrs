use anyhow::Result;
use bytes::Bytes;
use chrono::{DateTime, Days, Local};
use log::debug;
use rss::Channel;

use crate::seed::Article;

use super::Adapter;

/// RSS 适配器
#[derive(Default)]
pub struct RssAdapter {}

impl Adapter for RssAdapter {
  fn is_supported<U>(&self, _: U) -> Result<bool>
  where
    U: reqwest::IntoUrl,
  {
    // 支持所有 URL
    Ok(true)
  }

  fn adapt(&self, content: Bytes, seed_id: i64) -> Result<Vec<Article>> {
    debug!("Fetching using rss adapter");
    let now = Local::now();
    let deadline = now.checked_sub_days(Days::new(30)).unwrap();

    let channel = Channel::read_from(&content[..])?;
    let mut articles = Vec::new();

    for item in channel.items {
      let guid = if let Some(guid) = &item.guid {
        guid.value.clone()
      } else if let Some(link) = &item.link {
        link.clone()
      } else if let Some(title) = &item.title {
        title.clone()
      } else {
        String::default()
      };

      if let Some(date) = &item.pub_date {
        let date = DateTime::parse_from_rfc2822(date.as_str())?;

        if date > deadline {
          let date = date.timestamp();
          articles.push(Article {
            id: 0,
            seed_id,
            seed_name: String::default(),
            title: item.title,
            author: item.author,
            desc: item.description,
            link: item.link,
            pub_date: date,
            guid,
            unread: true,
          });
        }
      };
    }

    Ok(articles)
  }
}
