//! Extension Storage Module
//!
//! Provides persistent storage for extensions.
//! Each extension has its own isolated storage namespace.

use std::{collections::HashMap, fs, path::PathBuf};

use serde_json::Value;
use tauri::{AppHandle, Manager};

/// Get the storage directory for an extension
fn get_storage_dir(app: &AppHandle, extension_id: &str) -> Result<PathBuf, String> {
  let app_data_dir = app
    .path()
    .app_data_dir()
    .map_err(|e| format!("Failed to get app data dir: {}", e))?;

  let storage_dir = app_data_dir.join("extensions").join(extension_id);

  // Create directory if it doesn't exist
  if !storage_dir.exists() {
    fs::create_dir_all(&storage_dir).map_err(|e| format!("Failed to create storage dir: {}", e))?;
  }

  Ok(storage_dir)
}

/// Get the storage file path for an extension
fn get_storage_path(app: &AppHandle, extension_id: &str) -> Result<PathBuf, String> {
  let storage_dir = get_storage_dir(app, extension_id)?;
  Ok(storage_dir.join("storage.json"))
}

/// Load storage data for an extension
fn load_storage(app: &AppHandle, extension_id: &str) -> Result<HashMap<String, Value>, String> {
  let storage_path = get_storage_path(app, extension_id)?;

  if !storage_path.exists() {
    return Ok(HashMap::new());
  }

  let content =
    fs::read_to_string(&storage_path).map_err(|e| format!("Failed to read storage: {}", e))?;

  serde_json::from_str(&content).map_err(|e| format!("Failed to parse storage: {}", e))
}

/// Save storage data for an extension
fn save_storage(
  app: &AppHandle,
  extension_id: &str,
  data: &HashMap<String, Value>,
) -> Result<(), String> {
  let storage_path = get_storage_path(app, extension_id)?;

  let content = serde_json::to_string_pretty(data)
    .map_err(|e| format!("Failed to serialize storage: {}", e))?;

  fs::write(&storage_path, content).map_err(|e| format!("Failed to write storage: {}", e))
}

/// Get a value from extension storage
#[tauri::command]
pub async fn extension_storage_get(
  app: AppHandle,
  extension_id: String,
  key: String,
) -> Result<Option<String>, String> {
  let storage = load_storage(&app, &extension_id)?;

  match storage.get(&key) {
    Some(value) => {
      let json_str =
        serde_json::to_string(value).map_err(|e| format!("Failed to serialize value: {}", e))?;
      Ok(Some(json_str))
    }
    None => Ok(None),
  }
}

/// Set a value in extension storage
#[tauri::command]
pub async fn extension_storage_set(
  app: AppHandle,
  extension_id: String,
  key: String,
  value: String,
) -> Result<(), String> {
  let mut storage = load_storage(&app, &extension_id)?;

  let parsed_value: Value = serde_json::from_str(&value).map_err(|e| {
    format!(
      "[extension_storage_set]{} extID: {}, key: {} : value: {}",
      e, extension_id, key, value
    )
  })?;

  storage.insert(key, parsed_value);
  save_storage(&app, &extension_id, &storage)
}

/// Remove a value from extension storage
#[tauri::command]
pub async fn extension_storage_remove(
  app: AppHandle,
  extension_id: String,
  key: String,
) -> Result<(), String> {
  let mut storage = load_storage(&app, &extension_id)?;
  storage.remove(&key);
  save_storage(&app, &extension_id, &storage)
}
