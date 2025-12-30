use std::{
  path::{Path, PathBuf},
  process::{Command, Stdio},
};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FileSearchResult {
  pub path: String,
  pub name: String,
  pub is_directory: bool,
}

#[tauri::command]
pub fn validate_search_paths(paths: Vec<String>) -> Result<Vec<bool>, String> {
  let results: Vec<bool> = paths
    .iter()
    .map(|path| Path::new(path).exists())
    .collect();

  Ok(results)
}

/// Open a file with the specified method
#[tauri::command]
pub async fn open_file(path: String, method: Option<String>) -> Result<(), String> {
  let open_method = method.as_deref().unwrap_or("xdg-open");

  match open_method {
    "rifle" => {
      Command::new("rifle")
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open file with rifle: {}", e))?;
    }
    "system" => {
      Command::new("xdg-open")
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    _ => {
      Command::new("xdg-open")
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open file: {}", e))?;
    }
  }

  Ok(())
}

/// Search for files using fd-find or find command
#[tauri::command]
pub async fn search_files(
  query: String,
  max_results: Option<usize>,
  search_paths: Option<Vec<String>>,
) -> Result<Vec<FileSearchResult>, String> {
  let max_results = max_results.unwrap_or(50);
  let search_paths = search_paths.unwrap_or_else(|| {
    vec![
      std::env::var("HOME").unwrap_or_else(|_| "/home".to_string()),
    ]
  });

  // Try fd-find first
  if let Ok(results) = search_with_fd(&query, &search_paths, max_results).await {
    return Ok(results);
  }

  // Fallback to find command
  search_with_find(&query, &search_paths, max_results).await
}

/// Search files using fd-find command (faster, better UX)
async fn search_with_fd(
  query: &str,
  search_paths: &[String],
  max_results: usize,
) -> Result<Vec<FileSearchResult>, String> {
  let mut cmd = Command::new("fd");
  cmd
    .arg("--max-results")
    .arg(max_results.to_string())
    .arg("--type")
    .arg("f") // Files only (can be made configurable)
    .arg("--type")
    .arg("d") // Also include directories
    // .arg("--hidden") // Include hidden files
    .arg("--ignore-case") // Case insensitive
    .arg("--color")
    .arg("never")
    .arg(query);

  // Add search paths
  for path in search_paths {
    cmd.arg(path);
  }

  cmd.stdout(Stdio::piped()).stderr(Stdio::null());

  let output = cmd
    .output()
    .map_err(|e| format!("fd command failed: {}", e))?;

  if !output.status.success() {
    return Err("fd command not found or failed".to_string());
  }

  let stdout = String::from_utf8_lossy(&output.stdout);
  let results = parse_search_results(&stdout);

  Ok(results)
}

/// Search files using find command (slower, but available everywhere)
async fn search_with_find(
  query: &str,
  search_paths: &[String],
  max_results: usize,
) -> Result<Vec<FileSearchResult>, String> {
  let mut all_results = Vec::new();

  for search_path in search_paths {
    let mut cmd = Command::new("find");
    cmd
      .arg(search_path)
      .arg("-iname") // Case insensitive
      .arg(format!("*{}*", query))
      .arg("-print")
      .stdout(Stdio::piped())
      .stderr(Stdio::null());

    let output = cmd
      .output()
      .map_err(|e| format!("find command failed: {}", e))?;

    if !output.status.success() {
      continue;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut results = parse_search_results(&stdout);
    all_results.append(&mut results);

    if all_results.len() >= max_results {
      break;
    }
  }

  all_results.truncate(max_results);
  Ok(all_results)
}

/// Parse search results from command output
fn parse_search_results(output: &str) -> Vec<FileSearchResult> {
  output
    .lines()
    .filter(|line| !line.is_empty())
    .filter_map(|line| {
      let path = PathBuf::from(line);
      let name = path.file_name()?.to_str()?.to_string();

      let is_directory = path.is_dir();

      Some(FileSearchResult {
        path: line.to_string(),
        name,
        is_directory,
      })
    })
    .collect()
}
