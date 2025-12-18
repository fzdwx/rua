//! Notification Module
//!
//! Provides system notification functionality for extensions.

/// Show a system notification (not supported on non-Linux platforms yet)
#[tauri::command]
pub fn show_notification(_title: String, _body: Option<String>) -> Result<(), String> {
  // TODO: Implement for other platforms
  Ok(())
}
