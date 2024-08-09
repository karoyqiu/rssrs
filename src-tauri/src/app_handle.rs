use std::sync::OnceLock;

use log::error;
use tauri::AppHandle;

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

pub fn set_app_handle(app: &AppHandle) {
  let result = APP_HANDLE.set(app.to_owned());

  if result.is_err() {
    error!("Failed to set app handle!");
  }
}

pub fn get_app_handle() -> Option<AppHandle> {
  APP_HANDLE.get().map(|v| v.to_owned())
}
