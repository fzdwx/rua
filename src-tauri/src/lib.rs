mod applications;
mod proxy;

use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let win = app.get_webview_window("main").unwrap();
            win.eval("window.location.reload()").unwrap();
            #[cfg(desktop)]
            let _ = app.handle()
                .plugin(tauri_plugin_global_shortcut::Builder::new().build());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            applications::get_applications,
            applications::refresh_applications_cache,
            applications::launch_application,
            proxy::fetch_with_proxy
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
