mod control_server;
mod file_watcher;
mod fs_api;
pub mod types;
mod webpage_info;

#[cfg(target_os = "linux")]
mod linux;
use linux::*;
mod extension;
#[cfg(not(target_os = "linux"))]
mod not_linux;
use extension::*;
#[cfg(not(target_os = "linux"))]
use not_linux::*;

use std::path::PathBuf;
use tauri::http::{Request, Response};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{App, Manager};

fn setup(app: &mut App) -> anyhow::Result<()> {
    let win = app.get_webview_window("main").unwrap();
    win.eval("window.location.reload()")?;

    #[cfg(desktop)]
    let _ = app
        .handle()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build());

    // Setup system tray
    setup_tray(app)?;

    // Start the control server in a separate thread
    let app_handle = app.handle().clone();
    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            if let Err(e) = control_server::start_server(app_handle).await {
                eprintln!("Failed to start control server: {}", e);
            }
        });
    });

    Ok(())
}

fn setup_tray(app: &App) -> anyhow::Result<()> {
    let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let devtools_item = MenuItem::with_id(app, "devtools", "DevTools", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &devtools_item, &quit_item])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "devtools" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.open_devtools();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

/// Decode URL-safe base64 string
fn decode_base64_url_safe(encoded: &str) -> Option<String> {
    // Convert URL-safe base64 back to standard base64
    let standard = encoded.replace('-', "+").replace('_', "/");
    // Add padding if needed
    let padded = match standard.len() % 4 {
        2 => format!("{}==", standard),
        3 => format!("{}=", standard),
        _ => standard,
    };
    // Decode
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(&padded)
        .ok()
        .and_then(|bytes| String::from_utf8(bytes).ok())
}

/// Handle custom `ext://` protocol for loading extension files
/// URL format: ext://BASE64_ENCODED_BASE_DIR/filename
/// The host part contains the base64-encoded base directory
fn handle_ext_protocol(
    _ctx: tauri::UriSchemeContext<'_, tauri::Wry>,
    request: Request<Vec<u8>>,
) -> Response<Vec<u8>> {
    let uri = request.uri();
    let host = uri.host().unwrap_or("");
    let path_str = uri.path();

    // Decode URL-encoded path
    let decoded_path = urlencoding::decode(path_str).unwrap_or_else(|_| path_str.into());
    let relative_path = decoded_path.trim_start_matches('/');

    // Decode base directory from host (base64 URL-safe encoded)
    let file_path = if let Some(base_dir) = decode_base64_url_safe(host) {
        // Combine base directory with relative path
        PathBuf::from(&base_dir).join(relative_path)
    } else {
        // Fallback: treat path as absolute (for backward compatibility)
        PathBuf::from(decoded_path.as_ref())
    };

    serve_file(&file_path)
}

/// Serve a file from the filesystem
fn serve_file(file_path: &PathBuf) -> Response<Vec<u8>> {
    // Read the file
    match std::fs::read(file_path) {
        Ok(content) => {
            // Determine content type based on file extension
            let content_type = match file_path.extension().and_then(|e| e.to_str()) {
                Some("html") => "text/html",
                Some("js") => "application/javascript",
                Some("mjs") => "application/javascript",
                Some("css") => "text/css",
                Some("json") => "application/json",
                Some("png") => "image/png",
                Some("jpg") | Some("jpeg") => "image/jpeg",
                Some("svg") => "image/svg+xml",
                Some("woff") => "font/woff",
                Some("woff2") => "font/woff2",
                Some("ttf") => "font/ttf",
                _ => "application/octet-stream",
            };

            Response::builder()
                .status(200)
                .header("Content-Type", content_type)
                .header("Access-Control-Allow-Origin", "*")
                .body(content)
                .unwrap()
        }
        Err(e) => {
            eprintln!("[ext://] Failed to read file {:?}: {}", file_path, e);
            Response::builder()
                .status(404)
                .header("Content-Type", "text/plain")
                .body(format!("File not found: {}", e).into_bytes())
                .unwrap()
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // When another instance tries to start, show and focus the existing window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .register_uri_scheme_protocol("ext", handle_ext_protocol)
        .setup(|app| {
            setup(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_applications,
            refresh_applications_cache,
            launch_application,
            read_clipboard,
            write_clipboard,
            execute_shell_command,
            execute_shell_command_async,
            webpage_info::fetch_page_info,
            get_extensions,
            install_extension,
            uninstall_extension,
            enable_extension,
            disable_extension,
            get_extensions_path,
            load_dev_extension,
            file_watcher::watch_directory,
            file_watcher::stop_watching,
            file_watcher::is_watching,
            file_watcher::get_watched_path,
            show_notification,
            extension_storage_get,
            extension_storage_set,
            extension_storage_remove,
            fs_api::fs_read_text_file,
            fs_api::fs_read_binary_file,
            fs_api::fs_write_text_file,
            fs_api::fs_write_binary_file,
            fs_api::fs_read_dir,
            fs_api::fs_exists,
            fs_api::fs_stat,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
