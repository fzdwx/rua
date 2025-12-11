mod applications;
mod clipboard;
mod proxy;
mod control_server;

#[cfg(target_os = "linux")]
mod hyprland;

use tauri::{App, Manager};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn setup(app: &mut App) -> anyhow::Result<()> {
    let win = app.get_webview_window("main").unwrap();
    win.eval("window.location.reload()")?;

    #[cfg(desktop)]
    let _ = app
        .handle()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build());

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

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            setup(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            applications::get_applications,
            applications::refresh_applications_cache,
            applications::launch_application,
            proxy::fetch_with_proxy,
            clipboard::read_clipboard,
            clipboard::write_clipboard,
            #[cfg(target_os = "linux")]
            hyprland::focus_window_hyprland,
            #[cfg(target_os = "linux")]
            hyprland::move_to_current_workspace,
            #[cfg(target_os = "linux")]
            hyprland::is_window_on_current_workspace
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
