use crate::linux::hyprland;
use anyhow::bail;
use tauri::{Emitter, WebviewWindow};

pub fn show_window(window: WebviewWindow) -> anyhow::Result<String> {
    if let Err(e) = hyprland::move_to_current_workspace(Some("rua".to_string())) {
        eprintln!("Failed to move window to current workspace: {}", e);
    }
    if let Err(e) = window.center() {
        eprintln!("Failed to center window: {}", e);
    }
    if let Err(e) = window.show() {
        bail!(format!("Failed to show window: {}", e));
    }
    if let Err(e) = window.set_focus() {
        eprintln!("Failed to focus window: {}", e);
    }
    // Emit window-shown event
    let _ = window.emit("rua://window-shown", ());
    Ok("".to_string())
}

// 隐藏窗口
// 1. 如果在当前 workspace 则直接隐藏
// 2. 如果不在则移动 main 到当前 workspace
pub fn hide_window(window: WebviewWindow) -> anyhow::Result<String> {
    match hyprland::is_window_on_current_workspace(Some("rua".to_string())) {
        Ok(true) => {
            // Window is visible and on current workspace -> hide it
            if let Err(e) = window.hide() {
                bail!(format!("Failed to hide window: {}", e))
            }
            // Emit window-hidden event
            let _ = window.emit("rua://window-hidden", ());
            Ok("Window hidden".to_string())
        }
        Ok(false) => {
            // Window is visible but not on current workspace -> move it to current workspace
            if let Err(e) = hyprland::move_to_current_workspace(Some("rua".to_string())) {
                eprintln!("Failed to move window to current workspace: {}", e);
            }
            if let Err(e) = window.center() {
                eprintln!("Failed to center window: {}", e);
            }
            if let Err(e) = window.set_focus() {
                eprintln!("Failed to focus window: {}", e);
            }
            // Emit window-shown event (window is now visible on current workspace)
            let _ = window.emit("rua://window-shown", ());
            Ok("Window moved to current workspace".to_string())
        }
        Err(e) => {
            // Not on Hyprland or error checking, fallback to hide
            eprintln!("Failed to check workspace: {}", e);
            if let Err(e) = window.hide() {
                bail!(format!("Failed to hide window: {}", e))
            }
            // Emit window-hidden event
            let _ = window.emit("rua://window-hidden", ());
            Ok("Window hidden".to_string())
        }
    }
}
