//! File System API for extensions
//!
//! Provides file system operations for extensions with proper permission checks.

use std::{fs, path::Path};

use serde::{Deserialize, Serialize};

/// Expand environment variables in path (e.g., $HOME)
fn expand_path(path: &str) -> String {
  let mut result = path.to_string();

  // Expand $HOME
  if let Ok(home) = std::env::var("HOME") {
    result = result.replace("$HOME", &home);
  }

  // Expand ~ at the beginning
  if result.starts_with("~/") {
    if let Ok(home) = std::env::var("HOME") {
      result = format!("{}{}", home, &result[1..]);
    }
  } else if result == "~" {
    if let Ok(home) = std::env::var("HOME") {
      result = home;
    }
  }

  result
}

/// Directory entry information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirEntry {
  pub name: String,
  #[serde(rename = "isFile")]
  pub is_file: bool,
  #[serde(rename = "isDirectory")]
  pub is_directory: bool,
}

/// File stat information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileStat {
  pub size: u64,
  #[serde(rename = "isFile")]
  pub is_file: bool,
  #[serde(rename = "isDirectory")]
  pub is_directory: bool,
  pub mtime: u64,
  pub ctime: u64,
}

/// Read file contents as text
#[tauri::command]
pub async fn fs_read_text_file(path: String) -> Result<String, String> {
  let expanded_path = expand_path(&path);
  fs::read_to_string(&expanded_path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Read file contents as binary
#[tauri::command]
pub async fn fs_read_binary_file(path: String) -> Result<Vec<u8>, String> {
  let expanded_path = expand_path(&path);
  fs::read(&expanded_path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Write text to file
#[tauri::command]
pub async fn fs_write_text_file(path: String, contents: String) -> Result<(), String> {
  let expanded_path = expand_path(&path);
  // Create parent directories if they don't exist
  if let Some(parent) = Path::new(&expanded_path).parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
  }

  fs::write(&expanded_path, contents).map_err(|e| format!("Failed to write file: {}", e))
}

/// Write binary data to file
#[tauri::command]
pub async fn fs_write_binary_file(path: String, contents: Vec<u8>) -> Result<(), String> {
  let expanded_path = expand_path(&path);
  // Create parent directories if they don't exist
  if let Some(parent) = Path::new(&expanded_path).parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
  }

  fs::write(&expanded_path, contents).map_err(|e| format!("Failed to write file: {}", e))
}

/// Read directory contents
#[tauri::command]
pub async fn fs_read_dir(path: String) -> Result<Vec<DirEntry>, String> {
  let expanded_path = expand_path(&path);
  let entries =
    fs::read_dir(&expanded_path).map_err(|e| format!("Failed to read directory: {}", e))?;

  let mut result = Vec::new();
  for entry in entries {
    let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
    let metadata = entry
      .metadata()
      .map_err(|e| format!("Failed to get metadata: {}", e))?;

    result.push(DirEntry {
      name: entry.file_name().to_string_lossy().to_string(),
      is_file: metadata.is_file(),
      is_directory: metadata.is_dir(),
    });
  }

  Ok(result)
}

/// Check if file/directory exists
#[tauri::command]
pub async fn fs_exists(path: String) -> Result<bool, String> {
  let expanded_path = expand_path(&path);
  Ok(Path::new(&expanded_path).exists())
}

/// Get file/directory metadata
#[tauri::command]
pub async fn fs_stat(path: String) -> Result<FileStat, String> {
  let expanded_path = expand_path(&path);
  let metadata =
    fs::metadata(&expanded_path).map_err(|e| format!("Failed to get metadata: {}", e))?;

  let mtime = metadata
    .modified()
    .map(|t| {
      t.duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
    })
    .unwrap_or(0);

  let ctime = metadata
    .created()
    .map(|t| {
      t.duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
    })
    .unwrap_or(0);

  Ok(FileStat {
    size: metadata.len(),
    is_file: metadata.is_file(),
    is_directory: metadata.is_dir(),
    mtime,
    ctime,
  })
}
