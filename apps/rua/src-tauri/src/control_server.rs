use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Mutex;

const SERVER_PORT: u16 = 7777;

#[derive(Clone)]
pub struct AppState {
    pub app_handle: Arc<Mutex<Option<AppHandle>>>,
}

#[derive(Serialize, Deserialize)]
pub struct Response {
    success: bool,
    message: String,
}

/// Toggle window visibility
async fn toggle_window(State(state): State<AppState>) -> impl IntoResponse {
    let app_handle = state.app_handle.lock().await;

    if let Some(app) = app_handle.as_ref() {
        if let Some(window) = app.get_webview_window("main") {
            match window.is_visible() {
                Ok(true) => {
                    // Window is visible, check if it's on current workspace (Hyprland only)
                    #[cfg(target_os = "linux")]
                    {
                        match crate::hyprland::is_window_on_current_workspace(Some("rua".to_string())) {
                            Ok(true) => {
                                // Window is visible and on current workspace -> hide it
                                if let Err(e) = window.hide() {
                                    return (
                                        StatusCode::INTERNAL_SERVER_ERROR,
                                        Json(Response {
                                            success: false,
                                            message: format!("Failed to hide window: {}", e),
                                        }),
                                    );
                                }
                                // Emit window-hidden event
                                let _ = window.emit("rua://window-hidden", ());
                                return (
                                    StatusCode::OK,
                                    Json(Response {
                                        success: true,
                                        message: "Window hidden".to_string(),
                                    }),
                                );
                            }
                            Ok(false) => {
                                // Window is visible but not on current workspace -> move it to current workspace
                                if let Err(e) = crate::hyprland::move_to_current_workspace(Some("rua".to_string())) {
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
                                return (
                                    StatusCode::OK,
                                    Json(Response {
                                        success: true,
                                        message: "Window moved to current workspace".to_string(),
                                    }),
                                );
                            }
                            Err(e) => {
                                // Not on Hyprland or error checking, fallback to hide
                                eprintln!("Failed to check workspace: {}", e);
                                if let Err(e) = window.hide() {
                                    return (
                                        StatusCode::INTERNAL_SERVER_ERROR,
                                        Json(Response {
                                            success: false,
                                            message: format!("Failed to hide window: {}", e),
                                        }),
                                    );
                                }
                                // Emit window-hidden event
                                let _ = window.emit("rua://window-hidden", ());
                                return (
                                    StatusCode::OK,
                                    Json(Response {
                                        success: true,
                                        message: "Window hidden".to_string(),
                                    }),
                                );
                            }
                        }
                    }

                    #[cfg(not(target_os = "linux"))]
                    {
                        // Not on Linux, just hide
                        if let Err(e) = window.hide() {
                            return (
                                StatusCode::INTERNAL_SERVER_ERROR,
                                Json(Response {
                                    success: false,
                                    message: format!("Failed to hide window: {}", e),
                                }),
                            );
                        }
                        // Emit window-hidden event
                        let _ = window.emit("rua://window-hidden", ());
                        (
                            StatusCode::OK,
                            Json(Response {
                                success: true,
                                message: "Window hidden".to_string(),
                            }),
                        )
                    }
                }
                Ok(false) => {
                    // Window is not visible, show it
                    // Move to current workspace on Hyprland before showing
                    #[cfg(target_os = "linux")]
                    {
                        if let Err(e) = crate::hyprland::move_to_current_workspace(Some("rua".to_string())) {
                            eprintln!("Failed to move window to current workspace: {}", e);
                        }
                    }

                    if let Err(e) = window.center() {
                        eprintln!("Failed to center window: {}", e);
                    }
                    if let Err(e) = window.show() {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(Response {
                                success: false,
                                message: format!("Failed to show window: {}", e),
                            }),
                        );
                    }
                    if let Err(e) = window.set_focus() {
                        eprintln!("Failed to focus window: {}", e);
                    }
                    // Emit window-shown event
                    let _ = window.emit("rua://window-shown", ());
                    (
                        StatusCode::OK,
                        Json(Response {
                            success: true,
                            message: "Window shown".to_string(),
                        }),
                    )
                }
                Err(e) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(Response {
                        success: false,
                        message: format!("Failed to check window visibility: {}", e),
                    }),
                ),
            }
        } else {
            (
                StatusCode::NOT_FOUND,
                Json(Response {
                    success: false,
                    message: "Window not found".to_string(),
                }),
            )
        }
    } else {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(Response {
                success: false,
                message: "App handle not available".to_string(),
            }),
        )
    }
}

/// Health check endpoint
async fn health_check() -> impl IntoResponse {
    (
        StatusCode::OK,
        Json(Response {
            success: true,
            message: "Rua control server is running".to_string(),
        }),
    )
}

/// Start the control server
pub async fn start_server(app_handle: AppHandle) -> anyhow::Result<()> {
    let state = AppState {
        app_handle: Arc::new(Mutex::new(Some(app_handle))),
    };

    let app = Router::new()
        .route("/toggle", post(toggle_window))
        .route("/health", post(health_check))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", SERVER_PORT))
        .await?;

    println!("Rua control server listening on http://127.0.0.1:{}", SERVER_PORT);

    axum::serve(listener, app).await?;

    Ok(())
}
