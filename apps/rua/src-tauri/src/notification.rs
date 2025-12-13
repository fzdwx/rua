//! Notification Module
//!
//! Provides system notification functionality for extensions.

/// Show a system notification using notify-send on Linux
#[tauri::command]
#[cfg(target_os = "linux")]
pub fn show_notification(title: String, body: Option<String>) -> Result<(), String> {
    use std::process::Command;

    let mut cmd = Command::new("notify-send");
    cmd.arg(&title);
    
    if let Some(body_text) = body {
        cmd.arg(&body_text);
    }

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute notify-send: {}. Make sure libnotify is installed.", e))?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("notify-send failed: {}", stderr))
    }
}

/// Show a system notification (not supported on non-Linux platforms yet)
#[tauri::command]
#[cfg(not(target_os = "linux"))]
pub fn show_notification(_title: String, _body: Option<String>) -> Result<(), String> {
    // TODO: Implement for other platforms
    Ok(())
}
