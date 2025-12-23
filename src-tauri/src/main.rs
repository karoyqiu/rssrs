// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_handle;
mod db;
mod error;
mod events;
mod job;
mod seed;

use app_handle::set_app_handle;
use db::{
  db_add_watch_keyword, db_delete_seed, db_delete_watch_keyword, db_get_all_seeds, db_get_articles,
  db_get_setting, db_get_unread_count, db_get_watch_list, db_insert_seed, db_read_all,
  db_read_article, db_set_setting, db_update_seed, db_update_seed_rank, initialize, optimize,
  update_tray_tooltip, AppState,
};
use events::{
  ArticleReadEvent, SeedAddEvent, SeedNewEvent, SeedUnreadCountEvent, WatchlistChangeEvent,
};
use job::{check_seeds, download};
use tauri::{
  async_runtime::spawn,
  menu::{MenuBuilder, MenuItemBuilder},
  tray::TrayIconBuilder,
  AppHandle, Manager, State,
};
use tokio_schedule::{every, Job};

fn show_main_window(app: &AppHandle) -> tauri::Result<()> {
  if let Some(window) = app.get_webview_window("main") {
    window.show()?;
    window.set_focus()?;
  } else {
    tauri::webview::WebviewWindowBuilder::from_config(
      app,
      &app.config().app.windows.get(0).unwrap().clone(),
    )?
    .build()?;
  }

  Ok(())
}

fn main() {
  let builder = tauri_specta::Builder::<tauri::Wry>::new()
    // Then register them (separated by a comma)
    .commands(tauri_specta::collect_commands![
      db_add_watch_keyword,
      db_delete_seed,
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
      db_update_seed_rank,
      download,
    ])
    .events(tauri_specta::collect_events![
      ArticleReadEvent,
      SeedAddEvent,
      SeedNewEvent,
      SeedUnreadCountEvent,
      WatchlistChangeEvent,
    ])
    .error_handling(tauri_specta::ErrorHandlingMode::Throw);

  #[cfg(debug_assertions)]
  {
    let lang = specta_typescript::Typescript::new()
      .bigint(specta_typescript::BigIntExportBehavior::Number)
      .header("// @ts-nocheck\n");

    builder
      .export(&lang, "../src/lib/bindings.ts")
      .expect("Failed to export typescript bindings");
  }

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

  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .manage(AppState::default())
    .invoke_handler(builder.invoke_handler())
    .setup(move |app| {
      builder.mount_events(app);

      //let exit = MenuItemBuilder::with_id("exit", "Exit").build(app)?;
      let show = MenuItemBuilder::with_id("show", "Show").build(app)?;
      let menu = MenuBuilder::new(app)
        .item(&show)
        .separator()
        .quit()
        .build()?;

      let _ = TrayIconBuilder::with_id("main")
        .icon(app.default_window_icon().unwrap().clone())
        .title("RSS")
        .tooltip("RSS")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id().as_ref() {
          "show" => {
            show_main_window(app).unwrap();
          }
          _ => (),
        })
        .on_tray_icon_event(|tray_icon, event| match event {
          tauri::tray::TrayIconEvent::DoubleClick { .. } => {
            show_main_window(tray_icon.app_handle()).unwrap();
          }
          _ => (),
        })
        .build(app)?;

      let handle = app.handle();
      set_app_handle(&handle);

      let state: State<AppState> = handle.state();
      let db = initialize(&handle, false).expect("Failed to initialize database");
      *state.db.lock().unwrap() = Some(db);

      update_tray_tooltip(handle)?;

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while running tauri application")
    .run(|_app_handle, event| match event {
      tauri::RunEvent::ExitRequested { api, .. } => {
        api.prevent_exit();
      }
      _ => (),
    });
}
