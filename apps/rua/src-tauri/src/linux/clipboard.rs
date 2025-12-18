/// Read text from clipboard using xclip on Linux
#[tauri::command]
pub fn read_clipboard() -> Result<String, String> {
  use std::process::Command;

  // Try to read from clipboard using xclip
  let output = Command::new("xclip")
    .args(["-selection", "clipboard", "-o"])
    .output()
    .map_err(|e| {
      format!(
        "Failed to execute xclip: {}. Make sure xclip is installed.",
        e
      )
    })?;

  if output.status.success() {
    let text = String::from_utf8(output.stdout)
      .map_err(|e| format!("Failed to decode clipboard content: {}", e))?;
    Ok(text)
  } else {
    let stderr = String::from_utf8_lossy(&output.stderr);
    Err(format!("xclip failed: {}", stderr))
  }
}

/// Write text to clipboard using xclip on Linux
#[tauri::command]
pub fn write_clipboard(text: String) -> Result<(), String> {
  use std::{
    io::Write,
    process::{Command, Stdio},
  };

  let mut child = Command::new("xclip")
    .args(["-selection", "clipboard"])
    .stdin(Stdio::piped())
    .spawn()
    .map_err(|e| {
      format!(
        "Failed to execute xclip: {}. Make sure xclip is installed.",
        e
      )
    })?;

  if let Some(mut stdin) = child.stdin.take() {
    stdin
      .write_all(text.as_bytes())
      .map_err(|e| format!("Failed to write to xclip stdin: {}", e))?;
  }

  let status = child
    .wait()
    .map_err(|e| format!("Failed to wait for xclip: {}", e))?;

  if status.success() {
    Ok(())
  } else {
    Err("xclip failed to write to clipboard".to_string())
  }
}
