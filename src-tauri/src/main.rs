// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

mod db;

use db::{db_get_all_seeds, db_insert_seed, initialize, AppState};
use specta::{collect_types, ts::BigIntExportBehavior};
use tauri::{Manager, State};
use tauri_specta::ts;

fn main() {
  #[cfg(debug_assertions)]
  let config = specta::ts::ExportConfiguration::new().bigint(BigIntExportBehavior::Number);

  #[cfg(debug_assertions)]
  ts::export_with_cfg(
    collect_types![db_insert_seed, db_get_all_seeds].unwrap(),
    config,
    "../src/lib/bindings.ts",
  )
  .unwrap();

  tauri::Builder::default()
    .manage(AppState {
      db: Default::default(),
    })
    .invoke_handler(tauri::generate_handler![db_insert_seed, db_get_all_seeds])
    .setup(|app| {
      let handle = app.handle();
      let state: State<AppState> = handle.state();
      let db = initialize(&handle).expect("Failed to initialize database");
      *state.db.lock().unwrap() = Some(db);

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
