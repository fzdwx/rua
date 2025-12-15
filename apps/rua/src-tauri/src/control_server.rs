use axum::{extract::State, http::StatusCode, response::IntoResponse, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[cfg(target_os = "linux")]
use crate::linux::*;
#[cfg(not(target_os = "linux"))]
use crate::not_linux::*;

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

#[tauri::command]
pub async fn hide_window_command(app: AppHandle) -> Result<String, String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = hide_window(window);
    }
    Ok("OK".to_string())
}

/// Toggle window visibility
async fn toggle_window(State(state): State<AppState>) -> impl IntoResponse {
    let app_handle = state.app_handle.lock().await;

    if let Some(app) = app_handle.as_ref() {
        if let Some(window) = app.get_webview_window("main") {
            let result = match window.is_visible() {
                Ok(true) => hide_window(window),
                Ok(false) => show_window(window),
                Err(e) => Err(anyhow::anyhow!(e)),
            };

            match result {
                Ok(message) => (
                    StatusCode::OK,
                    Json(Response {
                        success: true,
                        message,
                    }),
                ),
                Err(e) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(Response {
                        success: false,
                        message: format!("Failed to toggle window: {}", e),
                    }),
                ),
            }
        } else {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(Response {
                    success: false,
                    message: "Main window not found".to_string(),
                }),
            )
        }
    } else {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
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

    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", SERVER_PORT)).await?;

    println!(
        "Rua control server listening on http://127.0.0.1:{}",
        SERVER_PORT
    );

    axum::serve(listener, app).await?;

    Ok(())
}
