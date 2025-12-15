use crate::types::ShellResult;
use std::env;
use std::process::Command;

/// Get the user's default shell
fn get_default_shell() -> String {
    // Try to get SHELL environment variable
    if let Ok(shell) = env::var("SHELL") {
        return shell;
    }

    // Fallback to sh if SHELL is not set
    "sh".to_string()
}

/// Execute a shell command using the default shell (waits for completion)
#[tauri::command]
pub async fn execute_shell_command(command: String) -> Result<ShellResult, String> {
    let shell = get_default_shell();

    // Execute the command using the default shell with -c flag
    let output = Command::new(&shell)
        .arg("-c")
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

    // Spawn the command without waiting for it to complete
    Command::new(&shell)
        .arg("-c")
        .arg(&command)
        .spawn()
        .map_err(|e| format!("Failed to spawn command with shell '{}': {}", shell, e))?;

    Ok(format!("Command started in background"))
}
