use crate::{
  job::{GenericSettings, ProxySettings},
  seed::{Article, Seed},
};

use super::Adapter;
use anyhow::Result;
use log::debug;
use reqwest::{IntoUrl, Proxy};
use scraper::{Html, Selector};

/// t66y 适配器
#[derive(Default)]
pub struct T66yAdapter {}

impl Adapter for T66yAdapter {
  fn is_supported<U>(&self, url: U) -> Result<bool>
  where
    U: IntoUrl,
  {
    let url = url.into_url()?;
    Ok(url.host_str().unwrap_or_default() == "www.t66y.com")
  }

  fn adapt(&self, content: bytes::Bytes, seed_id: i64) -> Result<Vec<Article>> {
    debug!("Fetching using t66y adapter");
    let content = String::from_utf8(content.to_vec())?;
    let doc = Html::parse_document(&content);
    let selector = Selector::parse("#ajaxtable > tbody:nth-child(2) .tr3").unwrap();
    let tal_selector = Selector::parse(".tal").unwrap();
    let h3a_selector = Selector::parse("h3 a").unwrap();
    let a_selector = Selector::parse("a").unwrap();
    let td3_selector = Selector::parse("td:nth-child(3)").unwrap();
    let ts_selector = Selector::parse("span[data-timestamp]").unwrap();

    let mut articles = Vec::new();

    for element in doc.select(&selector) {
      let tal = element.select(&tal_selector).next().expect("No title");
      let a = tal.select(&h3a_selector).next().expect("No h3");
      let td3 = element.select(&td3_selector).next().expect("No td3");
      let author = td3.select(&a_selector).next().expect("No author");
      let ts_span = td3.select(&ts_selector).next().expect("No ts");

      let title = a.text().collect::<Vec<_>>().join("");
      let link = format!("https://t66y.com/{}", a.attr("href").unwrap_or_default());
      let author = author.text().collect::<Vec<_>>().join("");
      let pub_date: i64 = ts_span.attr("data-timestamp").unwrap_or_default().parse()?;

      articles.push(Article {
        id: 0,
        seed_id: seed_id,
        seed_name: String::default(),
        guid: link.clone(),
        title: Some(title),
        author: Some(author),
        desc: None,
        link: Some(link),
        pub_date,
        unread: true,
      });
    }

    Ok(articles)
  }

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
    let mut articles = self.adapt(content, seed.id)?;

    for i in 0..articles.len() {
      let article = &mut articles[i];
      let link = article.link.clone().unwrap();
      let content = client.get(link).send().await?.text().await?;
      article.desc = Some(Self::get_description(&content)?);
    }

    Ok(articles)
  }
}

impl T66yAdapter {
  fn get_description(content: &str) -> Result<String> {
    let doc = Html::parse_document(&content);
    let content_selector = Selector::parse("div.tpc_content").unwrap();
    let content = doc.select(&content_selector).next().unwrap();
    Ok(content.inner_html())
  }
}
