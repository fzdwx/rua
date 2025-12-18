//! File Watcher Module
//!
//! Provides file watching capabilities for dev mode hot reload.

use std::{
  path::PathBuf,
  sync::{Arc, Mutex},
  time::Duration,
};

use notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebouncedEventKind};
use tauri::{AppHandle, Emitter};

/// Global state for the file watcher
struct WatcherState {
  /// The debouncer handle (dropping it stops the watcher)
  debouncer: Option<notify_debouncer_mini::Debouncer<notify::RecommendedWatcher>>,
  /// The path being watched
  watched_path: Option<PathBuf>,
}

lazy_static::lazy_static! {
    static ref WATCHER_STATE: Arc<Mutex<WatcherState>> = Arc::new(Mutex::new(WatcherState {
        debouncer: None,
        watched_path: None,
    }));
}

/// Event emitted when files change
#[derive(Clone, serde::Serialize)]
pub struct FileChangeEvent {
  pub path: String,
  pub kind: String,
}

/// Start watching a directory for file changes
/// Emits "file-change" events to the frontend when files change
#[tauri::command]
pub async fn watch_directory(app: AppHandle, path: String) -> Result<(), String> {
  let watch_path = PathBuf::from(&path);

  if !watch_path.exists() {
    return Err(format!("Path does not exist: {}", path));
  }

  if !watch_path.is_dir() {
    return Err(format!("Path is not a directory: {}", path));
  }

  // Stop any existing watcher first
  stop_watching_internal()?;

  let app_handle = app.clone();

  // Create a debounced watcher with 300ms debounce time
  let mut debouncer = new_debouncer(
    Duration::from_millis(300),
    move |result: Result<Vec<notify_debouncer_mini::DebouncedEvent>, notify::Error>| {
      match result {
        Ok(events) => {
          for event in events {
            if event.kind == DebouncedEventKind::Any {
              let event_data = FileChangeEvent {
                path: event.path.to_string_lossy().to_string(),
                kind: "change".to_string(),
              };

              // Emit event to frontend
              if let Err(e) = app_handle.emit("file-change", event_data) {
                eprintln!("Failed to emit file-change event: {}", e);
              }
            }
          }
        }
        Err(e) => {
          eprintln!("File watcher error: {:?}", e);
        }
      }
    },
  )
  .map_err(|e| format!("Failed to create file watcher: {}", e))?;

  // Start watching the directory recursively
  debouncer
    .watcher()
    .watch(&watch_path, RecursiveMode::Recursive)
    .map_err(|e| format!("Failed to watch directory: {}", e))?;

  // Store the watcher state
  let mut state = WATCHER_STATE
    .lock()
    .map_err(|e| format!("Lock error: {}", e))?;
  state.debouncer = Some(debouncer);
  state.watched_path = Some(watch_path);

  Ok(())
}

/// Stop watching the current directory
#[tauri::command]
pub async fn stop_watching() -> Result<(), String> {
  stop_watching_internal()
}

/// Internal function to stop watching (can be called from sync context)
fn stop_watching_internal() -> Result<(), String> {
  let mut state = WATCHER_STATE
    .lock()
    .map_err(|e| format!("Lock error: {}", e))?;

  // Dropping the debouncer stops the watcher
  state.debouncer = None;
  state.watched_path = None;

  Ok(())
}

/// Check if currently watching a directory
#[tauri::command]
pub async fn is_watching() -> Result<bool, String> {
  let state = WATCHER_STATE
    .lock()
    .map_err(|e| format!("Lock error: {}", e))?;
  Ok(state.debouncer.is_some())
}

/// Get the currently watched path
#[tauri::command]
pub async fn get_watched_path() -> Result<Option<String>, String> {
  let state = WATCHER_STATE
    .lock()
    .map_err(|e| format!("Lock error: {}", e))?;
  Ok(
    state
      .watched_path
      .as_ref()
      .map(|p| p.to_string_lossy().to_string()),
  )
}
