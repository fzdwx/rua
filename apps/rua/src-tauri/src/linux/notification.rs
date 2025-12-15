//! Notification Module
//!
//! Provides system notification functionality for extensions.

/// Show a system notification using notify-send on Linux
#[tauri::command]
pub fn show_notification(title: String, body: Option<String>) -> Result<(), String> {
    use std::process::Command;

    let mut cmd = Command::new("notify-send");
    cmd.arg(&title);

    if let Some(body_text) = body {
        cmd.arg(&body_text);
    }

    let output = cmd.output().map_err(|e| {
        format!(
            "Failed to execute notify-send: {}. Make sure libnotify is installed.",
            e
        )
    })?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("notify-send failed: {}", stderr))
    }
}
