// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod job;
mod seed;

use db::{
  db_get_all_seeds, db_get_items, db_get_setting, db_get_unread_count, db_insert_seed,
  db_mark_item_read, db_set_setting, initialize, AppState,
};
use job::check_seeds;
use seed::{SeedItemReadEvent, SeedUnreadCountEvent};
use specta::{collect_types, ts::BigIntExportBehavior};
use tauri::{async_runtime::spawn, Manager, State};
use tauri_specta::ts;
use tokio_schedule::{every, Job};

#[cfg(debug_assertions)]
fn export_bindings() {
  let config = specta::ts::ExportConfiguration::new().bigint(BigIntExportBehavior::String);

  println!(
    "{}",
    specta::ts::export::<SeedItemReadEvent>(&config).unwrap()
  );
  println!(
    "{}",
    specta::ts::export::<SeedUnreadCountEvent>(&config).unwrap()
  );

  ts::export_with_cfg(
    collect_types![
      db_get_all_seeds,
      db_get_items,
      db_get_setting,
      db_get_unread_count,
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

  let ctx = tauri::generate_context!();
  let config = ctx.config().clone();

  #[cfg(debug_assertions)]
  let task = every(10).seconds().perform(move || {
    let config = config.clone();
    async move {
      let _ = check_seeds(&config).await;
    }
  });

  #[cfg(not(debug_assertions))]
  let task = every(1).minute().perform(move || {
    let config = config.clone();
    async move {
      let _ = check_seeds(&config).await;
    }
  });

  spawn(task);

  tauri::Builder::default()
    .manage(AppState {
      db: Default::default(),
    })
    .invoke_handler(tauri::generate_handler![
      db_get_all_seeds,
      db_get_items,
      db_get_setting,
      db_get_unread_count,
      db_insert_seed,
      db_mark_item_read,
      db_set_setting
    ])
    .setup(|app| {
      let handle = app.handle();
      let app_dir = handle.path_resolver().app_data_dir();
      let state: State<AppState> = handle.state();
      let db = initialize(app_dir, false).expect("Failed to initialize database");
      *state.db.lock().unwrap() = Some(db);

      Ok(())
    })
    .run(ctx)
    .expect("error while running tauri application");
}
