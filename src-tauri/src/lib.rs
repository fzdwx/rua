use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Application {
    name: String,
    exec: String,
    icon: Option<String>,
    description: Option<String>,
    path: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_applications() -> Vec<Application> {
    let mut applications = Vec::new();

    // Common directories for .desktop files on Linux
    let home = &format!(
        "{}/.local/share/applications",
        std::env::var("HOME").unwrap_or_default()
    );
    let app_dirs = vec![
        "/usr/share/applications",
        "/usr/local/share/applications",
        home,
    ];

    for dir in app_dirs {
        let path = PathBuf::from(dir);
        if !path.exists() {
            continue;
        }

        for entry in WalkDir::new(path)
            .max_depth(2)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if let Some(ext) = entry.path().extension() {
                if ext == "desktop" {
                    if let Ok(app) = parse_desktop_file(entry.path()) {
                        applications.push(app);
                    }
                }
            }
        }
    }

    applications.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    applications
}

fn parse_desktop_file(path: &std::path::Path) -> Result<Application, Box<dyn std::error::Error>> {
    use freedesktop_desktop_entry::DesktopEntry;

    let contents = std::fs::read_to_string(path)?;
    let entry = DesktopEntry::decode(path, &contents)?;

    // Skip if NoDisplay is true
    if entry.no_display() {
        return Err("Application should not be displayed".into());
    }

    let name = entry.name(None).unwrap_or_default().to_string();
    let exec = entry.exec().unwrap_or_default().to_string();
    let icon = entry.icon().map(|s| s.to_string());
    let description = entry.comment(None).map(|s| s.to_string());

    Ok(Application {
        name,
        exec,
        icon,
        description,
        path: path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn launch_application(exec: String) -> Result<String, String> {
    // Remove field codes like %f, %F, %u, %U, etc.
    let cleaned_exec = exec
        .split_whitespace()
        .filter(|part| !part.starts_with('%'))
        .collect::<Vec<_>>()
        .join(" ");

    // Launch the application
    std::process::Command::new("sh")
        .arg("-c")
        .arg(&cleaned_exec)
        .spawn()
        .map_err(|e| format!("Failed to launch application: {}", e))?;

    Ok(format!("Launched: {}", cleaned_exec))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let win = app.get_webview_window("main").unwrap();
            win.eval("window.location.reload()").unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_applications,
            launch_application
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
