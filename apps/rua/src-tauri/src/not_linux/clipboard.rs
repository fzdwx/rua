/// Read text from clipboard (not supported on non-Linux platforms)
#[tauri::command]
#[cfg(not(target_os = "linux"))]
pub fn read_clipboard() -> Result<String, String> {
  // Return empty string on non-Linux platforms
  Ok(String::new())
}

/// Write text to clipboard (not supported on non-Linux platforms)
#[tauri::command]
#[cfg(not(target_os = "linux"))]
pub fn write_clipboard(_text: String) -> Result<(), String> {
  // No-op on non-Linux platforms
  Ok(())
}
