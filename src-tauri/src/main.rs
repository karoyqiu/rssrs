// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_handle;
mod db;
mod events;
mod job;
mod seed;

use app_handle::set_app_handle;
use db::{
  db_add_watch_keyword, db_delete_watch_keyword, db_get_all_seeds, db_get_items, db_get_setting,
  db_get_unread_count, db_get_watch_list, db_insert_seed, db_mark_item_read, db_set_setting,
  initialize, AppState,
};
use events::{SeedItemReadEvent, SeedUnreadCountEvent};
use job::check_seeds;
use specta::{collect_types, ts::BigIntExportBehavior};
use tauri::{async_runtime::spawn, Manager, State};
use tauri_specta::ts;
use tokio_schedule::{every, Job};

#[cfg(debug_assertions)]
fn export_bindings() {
  let config = specta::ts::ExportConfiguration::new().bigint(BigIntExportBehavior::Number);

  // println!(
  //   "{}",
  //   specta::ts::export::<SeedItemReadEvent>(&config).unwrap()
  // );
  // println!(
  //   "{}",
  //   specta::ts::export::<SeedUnreadCountEvent>(&config).unwrap()
  // );

  ts::export_with_cfg(
    collect_types![
      db_add_watch_keyword,
      db_delete_watch_keyword,
      db_get_all_seeds,
      db_get_items,
      db_get_setting,
      db_get_unread_count,
      db_get_watch_list,
      db_insert_seed,
      db_mark_item_read,
      db_set_setting
    ]
    .unwrap(),
    config,
    "../src/lib/bindings.ts",
  )
  .unwrap();
}

fn main() {
  #[cfg(debug_assertions)]
  export_bindings();

  env_logger::init();

  #[cfg(debug_assertions)]
  let task = every(10).seconds().perform(|| async {
    let _ = check_seeds().await;
  });

  #[cfg(not(debug_assertions))]
  let task = every(1).minute().perform(|| async {
    let _ = check_seeds().await;
  });

  spawn(task);

  tauri::Builder::default()
    .manage(AppState {
      db: Default::default(),
    })
    .invoke_handler(tauri::generate_handler![
      db_add_watch_keyword,
      db_delete_watch_keyword,
      db_get_all_seeds,
      db_get_items,
      db_get_setting,
      db_get_unread_count,
      db_get_watch_list,
      db_insert_seed,
      db_mark_item_read,
      db_set_setting
    ])
    .setup(|app| {
      let handle = app.handle();
      set_app_handle(&handle);

      let state: State<AppState> = handle.state();
      let db = initialize(&handle, false).expect("Failed to initialize database");
      *state.db.lock().unwrap() = Some(db);

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
