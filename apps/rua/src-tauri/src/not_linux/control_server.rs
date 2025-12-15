use crate::control_server::Response;
use anyhow::bail;
use axum::http::StatusCode;
use tauri::{Emitter, WebviewWindow};

pub fn show_window(window: WebviewWindow) -> anyhow::Result<String> {
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

pub fn hide_window(window: WebviewWindow) -> anyhow::Result<String> {
    // Not on Linux, just hide
    if let Err(e) = window.hide() {
        return bail!(format!("Failed to hide window: {}", e));
    }
    // Emit window-hidden event
    let _ = window.emit("rua://window-hidden", ());
    Ok("Window hidden".to_string())
}
