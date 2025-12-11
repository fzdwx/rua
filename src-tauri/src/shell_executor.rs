use std::process::Command;
use std::env;

#[derive(Debug, serde::Serialize)]
pub struct ShellResult {
    success: bool,
    stdout: String,
    stderr: String,
    exit_code: Option<i32>,
}

/// Get the user's default shell
fn get_default_shell() -> String {
    // Try to get SHELL environment variable
    if let Ok(shell) = env::var("SHELL") {
        return shell;
    }

    // Fallback to sh if SHELL is not set
    "sh".to_string()
}

/// Execute a shell command using the default shell
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
