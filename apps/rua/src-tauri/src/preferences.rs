//! Preferences Module
//!
//! Provides persistent storage for user preferences.
//! Each extension and the system has its own preference namespace.
//! Preferences are stored in: ~/.config/rua/preferences.json (or equivalent)

use std::{collections::HashMap, fs, path::PathBuf};

use serde_json::Value;
use tauri::{AppHandle, Manager};

/// Get the preferences file path
fn get_preferences_path(app: &AppHandle) -> Result<PathBuf, String> {
  let app_config_dir = app
    .path()
    .app_config_dir()
    .map_err(|e| format!("Failed to get app config dir: {}", e))?;

  // Create directory if it doesn't exist
  if !app_config_dir.exists() {
    fs::create_dir_all(&app_config_dir)
      .map_err(|e| format!("Failed to create config dir: {}", e))?;
  }

  Ok(app_config_dir.join("preferences.json"))
}

/// Load all preferences from disk
/// Returns a map of namespace -> (key -> value)
pub(crate) fn load_preferences(app: &AppHandle) -> Result<HashMap<String, HashMap<String, Value>>, String> {
  let preferences_path = get_preferences_path(app)?;

  if !preferences_path.exists() {
    return Ok(HashMap::new());
  }

  let content = fs::read_to_string(&preferences_path)
    .map_err(|e| format!("Failed to read preferences: {}", e))?;

  serde_json::from_str(&content).map_err(|e| format!("Failed to parse preferences: {}", e))
}

/// Save all preferences to disk
pub(crate) fn save_preferences(
  app: &AppHandle,
  data: &HashMap<String, HashMap<String, Value>>,
) -> Result<(), String> {
  let preferences_path = get_preferences_path(app)?;

  let content = serde_json::to_string_pretty(data)
    .map_err(|e| format!("Failed to serialize preferences: {}", e))?;

  fs::write(&preferences_path, content).map_err(|e| format!("Failed to write preferences: {}", e))
}

/// Get a preference value
/// namespace is either "system" for built-in preferences or the extension ID
#[tauri::command]
pub async fn get_preference(
  app: AppHandle,
  namespace: String,
  key: String,
) -> Result<Option<String>, String> {
  let preferences = load_preferences(&app)?;

  if let Some(namespace_prefs) = preferences.get(&namespace) {
    if let Some(value) = namespace_prefs.get(&key) {
      let json_str =
        serde_json::to_string(value).map_err(|e| format!("Failed to serialize value: {}", e))?;
      return Ok(Some(json_str));
    }
  }

  Ok(None)
}

/// Get all preferences for a namespace
#[tauri::command]
pub async fn get_all_preferences(
  app: AppHandle,
  namespace: String,
) -> Result<HashMap<String, String>, String> {
  let preferences = load_preferences(&app)?;

  if let Some(namespace_prefs) = preferences.get(&namespace) {
    let mut result = HashMap::new();
    for (key, value) in namespace_prefs {
      let json_str =
        serde_json::to_string(value).map_err(|e| format!("Failed to serialize value: {}", e))?;
      result.insert(key.clone(), json_str);
    }
    return Ok(result);
  }

  Ok(HashMap::new())
}

/// Set a preference value
/// namespace is either "system" for built-in preferences or the extension ID
#[tauri::command]
pub async fn set_preference(
  app: AppHandle,
  namespace: String,
  key: String,
  value: String,
) -> Result<(), String> {
  let mut preferences = load_preferences(&app)?;

  let parsed_value: Value = serde_json::from_str(&value).map_err(|e| {
    format!(
      "[set_preference] {} - namespace: {}, key: {}, value: {}",
      e, namespace, key, value
    )
  })?;

  preferences
    .entry(namespace)
    .or_insert_with(HashMap::new)
    .insert(key, parsed_value);

  save_preferences(&app, &preferences)
}

/// Set multiple preferences at once for a namespace
#[tauri::command]
pub async fn set_all_preferences(
  app: AppHandle,
  namespace: String,
  values: HashMap<String, String>,
) -> Result<(), String> {
  let mut preferences = load_preferences(&app)?;

  let namespace_prefs = preferences.entry(namespace).or_insert_with(HashMap::new);

  for (key, value) in values {
    let parsed_value: Value = serde_json::from_str(&value).map_err(|e| {
      format!(
        "[set_all_preferences] {} - key: {}, value: {}",
        e, key, value
      )
    })?;
    namespace_prefs.insert(key, parsed_value);
  }

  save_preferences(&app, &preferences)
}

/// Remove a preference value
#[tauri::command]
pub async fn remove_preference(
  app: AppHandle,
  namespace: String,
  key: String,
) -> Result<(), String> {
  let mut preferences = load_preferences(&app)?;

  if let Some(namespace_prefs) = preferences.get_mut(&namespace) {
    namespace_prefs.remove(&key);
    save_preferences(&app, &preferences)?;
  }

  Ok(())
}

/// Remove all preferences for a namespace
#[tauri::command]
pub async fn remove_all_preferences(app: AppHandle, namespace: String) -> Result<(), String> {
  let mut preferences = load_preferences(&app)?;
  preferences.remove(&namespace);
  save_preferences(&app, &preferences)
}
