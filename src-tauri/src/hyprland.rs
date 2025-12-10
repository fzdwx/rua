use std::process::Command;
use serde_json::Value;
use tauri::Window;

/// Get the current active workspace ID
fn get_active_workspace() -> Result<i64, String> {
    let output = Command::new("hyprctl")
        .args(["activeworkspace", "-j"])
        .output()
        .map_err(|e| format!("Failed to get active workspace: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Failed to get active workspace: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let workspace_json: Value = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Failed to parse workspace JSON: {}", e))?;

    workspace_json["id"]
        .as_i64()
        .ok_or_else(|| "Failed to get workspace ID from JSON".to_string())
}

/// Get the workspace ID where the window with specified class is located
fn get_window_workspace(class: &str) -> Result<Option<i64>, String> {
    let output = Command::new("hyprctl")
        .args(["clients", "-j"])
        .output()
        .map_err(|e| format!("Failed to get clients: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Failed to get clients: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let clients: Value = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Failed to parse clients JSON: {}", e))?;

    if let Some(clients_array) = clients.as_array() {
        for client in clients_array {
            if let Some(client_class) = client["class"].as_str() {
                if client_class == class {
                    return Ok(client["workspace"]["id"].as_i64());
                }
            }
        }
    }

    Ok(None)
}

/// Check if window is on current workspace
#[tauri::command]
pub fn is_window_on_current_workspace(class: Option<String>) -> Result<bool, String> {
    let class_name = class.unwrap_or_else(|| "rua".to_string());

    let active_workspace = get_active_workspace()?;
    let window_workspace = get_window_workspace(&class_name)?;

    Ok(window_workspace == Some(active_workspace))
}

/// Moves the Tauri window to the current active workspace in Hyprland
#[tauri::command]
pub fn focus_window_hyprland(window: Window) -> Result<(), String> {
    // Get the window title to identify it in Hyprland
    let title = window.title().map_err(|e| e.to_string())?;

    // Use hyprctl to focus the window by title, which will automatically
    // move it to the current workspace if needed
    let output = Command::new("hyprctl")
        .args(["dispatch", "focuswindow", &format!("title:{}", title)])
        .output()
        .map_err(|e| format!("Failed to execute hyprctl: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "hyprctl command failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(())
}

/// Move window to current workspace by class name
#[tauri::command]
pub fn move_to_current_workspace(class: Option<String>) -> Result<(), String> {
    let class_name = class.unwrap_or_else(|| "rua".to_string());

    let workspace_id = get_active_workspace()?;

    // Move window to current workspace using the format: "workspace,class:classname"
    let move_arg = format!("{},class:{}", workspace_id, class_name);
    let output = Command::new("hyprctl")
        .args(["dispatch", "movetoworkspacesilent", &move_arg])
        .output()
        .map_err(|e| format!("Failed to execute hyprctl: {}", e))?;

    // Check if the command output contains an error message
    let stdout = String::from_utf8_lossy(&output.stdout);
    if stdout.contains("Error") || stdout.contains("error") {
        return Err(format!("hyprctl command failed: {}", stdout));
    }

    Ok(())
}
