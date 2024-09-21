// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod adapter;
mod app_handle;
mod db;
mod error;
mod events;
mod job;
mod seed;

use app_handle::set_app_handle;
use db::{
  db_add_watch_keyword, db_delete_watch_keyword, db_get_all_seeds, db_get_articles, db_get_setting,
  db_get_unread_count, db_get_watch_list, db_insert_seed, db_read_all, db_read_article,
  db_set_setting, db_update_seed, initialize, optimize, AppState,
};
use job::{check_seeds, fetch_seed};
use tauri::{
  async_runtime::spawn, AppHandle, CustomMenuItem, Manager, State, SystemTray, SystemTrayEvent,
  SystemTrayMenu, SystemTrayMenuItem, WindowBuilder,
};
use tokio_schedule::{every, Job};

#[cfg(debug_assertions)]
fn export_bindings() {
  //use job::GenericSettings;
  use specta::{collect_types, ts::BigIntExportBehavior};
  use tauri_specta::ts;

  let config = specta::ts::ExportConfiguration::new().bigint(BigIntExportBehavior::Number);

  // println!(
  //   "{}",
  //   specta::ts::export::<GenericSettings>(&config).unwrap()
  // );

  ts::export_with_cfg(
    collect_types![
      db_add_watch_keyword,
      db_delete_watch_keyword,
      db_get_all_seeds,
      db_get_articles,
      db_get_setting,
      db_get_unread_count,
      db_get_watch_list,
      db_insert_seed,
      db_read_article,
      db_read_all,
      db_set_setting,
      db_update_seed,
      fetch_seed,
    ]
    .unwrap(),
    config,
    "../src/lib/bindings.ts",
  )
  .unwrap();
}

fn show_main_window(app: &AppHandle) -> tauri::Result<()> {
  if let Some(window) = app.get_window("main") {
    window.show()?;
    window.set_focus()?;
  } else {
    WindowBuilder::from_config(app, app.config().tauri.windows.get(0).unwrap().clone()).build()?;
  }

  Ok(())
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

  // 每小时优化一次数据库
  let optimze_task = every(1).hour().perform(|| async {
    optimize();
  });
  spawn(optimze_task);

  let exit = CustomMenuItem::new("exit".to_string(), "Exit");
  let show = CustomMenuItem::new("show".to_string(), "Show");
  let tray_menu = SystemTrayMenu::new()
    .add_item(show)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(exit);

  #[cfg(debug_assertions)]
  let tray = SystemTray::new()
    .with_tooltip("RSS Dev")
    .with_menu(tray_menu);
  #[cfg(not(debug_assertions))]
  let tray = SystemTray::new().with_tooltip("RSS").with_menu(tray_menu);

  tauri::Builder::default()
    .manage(AppState {
      db: Default::default(),
    })
    .invoke_handler(tauri::generate_handler![
      db_add_watch_keyword,
      db_delete_watch_keyword,
      db_get_all_seeds,
      db_get_articles,
      db_get_setting,
      db_get_unread_count,
      db_get_watch_list,
      db_insert_seed,
      db_read_article,
      db_read_all,
      db_set_setting,
      db_update_seed,
      fetch_seed,
    ])
    .setup(|app| {
      let handle = app.handle();
      set_app_handle(&handle);

      let state: State<AppState> = handle.state();
      let db = initialize(&handle, false).expect("Failed to initialize database");
      *state.db.lock().unwrap() = Some(db);

      Ok(())
    })
    .system_tray(tray)
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::DoubleClick { .. } => {
        show_main_window(app).unwrap();
      }
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "show" => {
          show_main_window(app).unwrap();
        }
        "exit" => {
          app.exit(0);
        }
        _ => {}
      },
      _ => {}
    })
    .build(tauri::generate_context!())
    .expect("error while running tauri application")
    .run(|_app_handle, event| match event {
      tauri::RunEvent::ExitRequested { api, .. } => {
        api.prevent_exit();
      }
      _ => {}
    });
}
