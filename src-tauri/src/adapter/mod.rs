mod rss;
mod t66y;

use anyhow::Result;
use bytes::Bytes;
use reqwest::{IntoUrl, Proxy};

use crate::{
  job::{GenericSettings, ProxySettings},
  seed::{Article, Seed},
};

pub use rss::RssAdapter;
pub use t66y::T66yAdapter;

/// 适配器接口
pub trait Adapter {
  /// 是否支持适配指定 URL
  fn is_supported<U>(&self, url: U) -> Result<bool>
  where
    U: IntoUrl;

  /// 将字节块转换为文章数组
  fn adapt(&self, content: Bytes, seed_id: i64) -> Result<Vec<Article>>;

  /// 从指定 URL 获取字节流并转换为文章数组
  async fn fetch(
    &self,
    proxy: &ProxySettings,
    generic: &GenericSettings,
    seed: &Seed,
  ) -> Result<Vec<Article>> {
    let mut client = reqwest::Client::builder();

    match proxy.t.as_str() {
      "none" => {
        client = client.no_proxy();
      }
      "http" => {
        client = client.proxy(Proxy::all(format!("http://{}:{}", proxy.host, proxy.port))?);
      }
      _ => {}
    }

    let client = client
      .timeout(std::time::Duration::from_secs(generic.timeout.into()))
      .build()?;
    let content = client.get(&seed.url).send().await?.bytes().await?;

    self.adapt(content, seed.id)
  }
}
