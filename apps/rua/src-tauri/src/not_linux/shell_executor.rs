use std::{env, process::Command};

use crate::types::ShellResult;

/// Get the user's default shell
fn get_default_shell() -> String {
  if cfg!(target_os = "windows") {
    // On Windows, use COMSPEC environment variable (points to cmd.exe)
    env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string())
  } else {
    // On macOS and other Unix-like systems, use SHELL environment variable
    env::var("SHELL").unwrap_or_else(|_| "sh".to_string())
  }
}

/// Get the shell flag for executing commands
fn get_shell_flag() -> &'static str {
  if cfg!(target_os = "windows") {
    "/C" // cmd.exe flag for executing commands
  } else {
    "-c" // Unix shell flag for executing commands
  }
}

/// Execute a shell command using the default shell (waits for completion)
#[tauri::command]
pub async fn execute_shell_command(command: String) -> Result<ShellResult, String> {
  let shell = get_default_shell();
  let flag = get_shell_flag();

  // Execute the command using the default shell
  let output = Command::new(&shell)
    .arg(flag)
    .arg(&command)
    .output()
    .map_err(|e| format!("Failed to execute command with shell '{}': {}", shell, e))?;

  let result = ShellResult {
    success: output.status.success(),
    stdout: String::from_utf8_lossy(&output.stdout).to_string(),
    stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    exit_code: output.status.code(),
  };

  Ok(result)
}

/// Execute a shell command asynchronously without waiting for completion
#[tauri::command]
pub async fn execute_shell_command_async(command: String) -> Result<String, String> {
  let shell = get_default_shell();
  let flag = get_shell_flag();

  // Spawn the command without waiting for it to complete
  Command::new(&shell)
    .arg(flag)
    .arg(&command)
    .spawn()
    .map_err(|e| format!("Failed to spawn command with shell '{}': {}", shell, e))?;

  Ok(format!("Command started in background"))
}
