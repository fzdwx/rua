use crate::linux::{display_server, hyprland, x11_window};
use anyhow::bail;
use tauri::{Emitter, WebviewWindow};

pub fn show_window(window: WebviewWindow) -> anyhow::Result<String> {
    let display_server_type = display_server::detect_display_server();

    match display_server_type {
        display_server::DisplayServer::Hyprland => {
            // Hyprland 特定优化：跨 workspace 移动
            if let Err(e) = hyprland::move_to_current_workspace(Some("rua".to_string())) {
                eprintln!(
                    "[Hyprland] Failed to move window to current workspace: {}",
                    e
                );
            }
        }
        display_server::DisplayServer::X11 => {
            // X11 通用实现
            if let Some(wm) = x11_window::X11WindowManager::new() {
                if let Some(win_id) = wm.find_window_by_class("rua") {
                    if let Err(e) = wm.show_window(win_id) {
                        eprintln!("[X11] show_window failed, falling back to Tauri API: {}", e);
                    } else {
                        // X11 操作成功，但仍然使用 Tauri API 确保状态同步
                        eprintln!("[X11] Window shown via X11, syncing with Tauri");
                    }
                } else {
                    eprintln!("[X11] Window not found, using Tauri API");
                }
            } else {
                eprintln!("[X11] Failed to connect, falling back to Tauri API");
            }
        }
        display_server::DisplayServer::Unknown => {
            eprintln!("[DisplayServer] Unknown display server, using Tauri API");
        }
    }

    // 通用 Tauri 操作（所有情况下都执行，确保状态同步）
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
    Ok("Window shown".to_string())
}

// 隐藏窗口
// 1. 如果在 Hyprland，检查是否在当前 workspace
// 2. 如果在 X11，直接隐藏
// 3. 否则使用 Tauri API
pub fn hide_window(window: WebviewWindow) -> anyhow::Result<String> {
    let display_server_type = display_server::detect_display_server();

    match display_server_type {
        display_server::DisplayServer::Hyprland => {
            // Hyprland 特定逻辑（保持原有复杂逻辑）
            match hyprland::is_window_on_current_workspace(Some("rua".to_string())) {
                Ok(true) => {
                    // Window is visible and on current workspace -> hide it
                    if let Err(e) = window.hide() {
                        bail!(format!("Failed to hide window: {}", e))
                    }
                    // Emit window-hidden event
                    let _ = window.emit("rua://window-hidden", ());
                    return Ok("Window hidden".to_string());
                }
                Ok(false) => {
                    // Window is visible but not on current workspace -> move it to current workspace
                    if let Err(e) = hyprland::move_to_current_workspace(Some("rua".to_string())) {
                        eprintln!(
                            "[Hyprland] Failed to move window to current workspace: {}",
                            e
                        );
                    }
                    if let Err(e) = window.center() {
                        eprintln!("Failed to center window: {}", e);
                    }
                    if let Err(e) = window.set_focus() {
                        eprintln!("Failed to focus window: {}", e);
                    }
                    if let Err(e) = hyprland::focus_by_class(Some("rua".to_string())) {
                        eprintln!("[Hyprland] Failed to focus window: {}", e);
                    }
                    // Emit window-shown event (window is now visible on current workspace)
                    let _ = window.emit("rua://window-shown", ());
                    return Ok("Window moved to current workspace".to_string());
                }
                Err(e) => {
                    // Not on Hyprland or error checking, fallback to hide
                    eprintln!("[Hyprland] Failed to check workspace: {}", e);
                }
            }
        }
        display_server::DisplayServer::X11 => {
            // X11 实现：直接隐藏窗口
            if let Some(wm) = x11_window::X11WindowManager::new() {
                if let Some(win_id) = wm.find_window_by_class("rua") {
                    if let Err(e) = wm.hide_window(win_id) {
                        eprintln!("[X11] hide_window failed: {}", e);
                    } else {
                        // X11 操作成功，但仍然使用 Tauri API 确保状态同步
                        eprintln!("[X11] Window hidden via X11, syncing with Tauri");
                    }
                }
            }
        }
        display_server::DisplayServer::Unknown => {
            eprintln!("[DisplayServer] Unknown display server, using Tauri API");
        }
    }

    // 回退到 Tauri API（所有情况下都执行，确保状态同步）
    if let Err(e) = window.hide() {
        bail!(format!("Failed to hide window: {}", e))
    }
    // Emit window-hidden event
    let _ = window.emit("rua://window-hidden", ());
    Ok("Window hidden".to_string())
}
