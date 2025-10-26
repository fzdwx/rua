use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use tauri::Manager;
use walkdir::WalkDir;
use global_hotkey::{GlobalHotKeyManager, hotkey::{HotKey, Modifiers, Code}, GlobalHotKeyEvent};

lazy_static::lazy_static! {
    static ref ICON_CACHE: Mutex<HashMap<String, Option<String>>> = Mutex::new(HashMap::new());
    static ref TERMINAL_EMULATOR: Mutex<Option<String>> = Mutex::new(None);
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Application {
    name: String,
    exec: String,
    icon: Option<String>,
    description: Option<String>,
    path: String,
    terminal: bool,
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

/// Generate possible icon paths for a given icon name
fn generate_icon_paths(icon_name: &str) -> Vec<String> {
    vec![
        icon_name.to_string(),
        format!("/usr/share/icons/hicolor/scalable/apps/{}.svg", icon_name),
        format!("/usr/share/icons/hicolor/48x48/apps/{}.png", icon_name),
        format!("/usr/share/icons/hicolor/32x32/apps/{}.png", icon_name),
        format!("/usr/share/icons/hicolor/16x16/apps/{}.png", icon_name),
        format!("/usr/share/icons/hicolor/128x128/apps/{}.png", icon_name),
        format!("/usr/share/icons/hicolor/256x256/apps/{}.png", icon_name),
        format!("/usr/share/icons/hicolor/512x512/apps/{}.png", icon_name),
        format!("/usr/share/icons/breeze/apps/48/{}.png", icon_name),
        format!("/usr/share/icons/breeze/apps/48/{}.svg", icon_name),
        format!("/usr/share/icons/breeze/apps/16/{}.svg", icon_name),
        format!("/usr/share/icons/breeze/status/16/{}.svg", icon_name),
        format!("/usr/share/icons/breeze/status/24/{}.svg", icon_name),
        format!("/usr/share/pixmaps/{}.svg", icon_name),
        format!("/usr/share/pixmaps/{}.png", icon_name),
        format!("/usr/share/pixmaps/{}", icon_name),
        format!("/usr/share/icons/{}.png", icon_name),
        format!("/usr/share/icons/breeze/actions/16/{}.svg", icon_name),
        format!("/usr/share/icons/breeze/actions/24/{}.svg", icon_name),
        format!("/usr/share/icons/breeze/places/16/{}.svg", icon_name),
        format!("/usr/share/icons/breeze/preferences/16/{}.svg", icon_name),
        format!("/usr/share/icons/breeze/devices/16/{}.svg", icon_name),
        format!("/usr/share/icons/breeze/applets/64/{}.svg", icon_name),
        format!("/usr/share/icons/breeze/preferences/24/{}.svg", icon_name),
        format!("/usr/share/icons/breeze/preferences/32/{}.svg", icon_name),
        format!(
            "/usr/share/icons/Adwaita/16x16/legacy/{}-symbolic.png",
            icon_name
        ),
        format!(
            "/usr/share/icons/Adwaita/symbolic/legacy/{}-symbolic.png",
            icon_name
        ),
        format!(
            "/usr/share/icons/Adwaita/symbolic/legacy/{}-symbolic.svg",
            icon_name
        ),
        format!("/usr/share/icons/breeze/actions/symbolic/{}.svg", icon_name),
        format!("/usr/share/icons/Adwaita/symbolic/legacy/{}.svg", icon_name),
    ]
}

/// Find the actual icon file path for a given icon name
fn resolve_icon_path(icon_name: &str) -> Option<String> {
    if icon_name.is_empty() {
        return None;
    }

    // Check cache first
    {
        let cache = ICON_CACHE.lock().unwrap();
        if let Some(cached) = cache.get(icon_name) {
            return cached.clone();
        }
    }

    // If the icon name is already an absolute path, check if it exists
    if icon_name.starts_with('/') {
        if std::path::Path::new(icon_name).exists() {
            let result = Some(format!("file://{}", icon_name));
            ICON_CACHE
                .lock()
                .unwrap()
                .insert(icon_name.to_string(), result.clone());
            return result;
        }
    }

    // Search through common icon paths
    let paths = generate_icon_paths(icon_name);
    for path in paths {
        if std::path::Path::new(&path).exists() {
            let result = Some(format!("file://{}", path));
            ICON_CACHE
                .lock()
                .unwrap()
                .insert(icon_name.to_string(), result.clone());
            return result;
        }
    }

    // Cache the negative result
    ICON_CACHE
        .lock()
        .unwrap()
        .insert(icon_name.to_string(), None);
    None
}

/// Detect available terminal emulator
fn detect_terminal_emulator() -> Option<String> {
    // Check cache first
    {
        let cache = TERMINAL_EMULATOR.lock().unwrap();
        if cache.is_some() {
            return cache.clone();
        }
    }

    // List of common terminal emulators in order of preference
    let terminals = vec![
        "wezterm",
        "konsole",        // KDE
        "gnome-terminal", // GNOME
        "alacritty",      // Modern, GPU-accelerated
        "kitty",          // Modern, GPU-accelerated
        "terminator",     // Feature-rich
        "tilix",          // Tiling terminal
        "xfce4-terminal", // XFCE
        "mate-terminal",  // MATE
        "lxterminal",     // LXDE
        "xterm",          // Fallback, always available
    ];

    for terminal in terminals {
        // Use which crate to find terminal in PATH (similar to exec.LookPath in Go)
        if which::which(terminal).is_ok() {
            let result = Some(terminal.to_string());
            *TERMINAL_EMULATOR.lock().unwrap() = result.clone();
            eprintln!("Detected terminal emulator: {}", terminal);
            return result;
        }
    }

    eprintln!("No terminal emulator found!");
    None
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
    let description = entry.comment(None).map(|s| s.to_string());
    let terminal = entry.terminal();

    // Resolve icon path
    let icon = entry.icon().and_then(|icon_name| {
        let resolved = resolve_icon_path(icon_name);
        // Debug logging
        if resolved.is_some() {
            eprintln!("Icon for {}: {} -> {:?}", name, icon_name, resolved);
        } else {
            eprintln!("Icon not found for {}: {}", name, icon_name);
        }
        resolved
    });

    Ok(Application {
        name,
        exec,
        icon,
        description,
        path: path.to_string_lossy().to_string(),
        terminal,
    })
}

#[tauri::command]
fn launch_application(exec: String, terminal: bool) -> Result<String, String> {
    // Remove field codes like %f, %F, %u, %U, etc.
    let cleaned_exec = exec
        .split_whitespace()
        .filter(|part| !part.starts_with('%'))
        .collect::<Vec<_>>()
        .join(" ");

    if terminal {
        // Application needs to run in terminal
        let terminal_emulator =
            detect_terminal_emulator().ok_or_else(|| "No terminal emulator found".to_string())?;

        // Build command based on terminal emulator
        let (cmd, args) = match terminal_emulator.as_str() {
            "wezterm"=> ("wezterm", vec!["-e", &cleaned_exec]),
            "konsole" => ("konsole", vec!["-e", &cleaned_exec]),
            "gnome-terminal" => ("gnome-terminal", vec!["--", "sh", "-c", &cleaned_exec]),
            "alacritty" => ("alacritty", vec!["-e", "sh", "-c", &cleaned_exec]),
            "kitty" => ("kitty", vec!["sh", "-c", &cleaned_exec]),
            "terminator" => ("terminator", vec!["-e", &cleaned_exec]),
            "tilix" => ("tilix", vec!["-e", &cleaned_exec]),
            "xfce4-terminal" => ("xfce4-terminal", vec!["-e", &cleaned_exec]),
            "mate-terminal" => ("mate-terminal", vec!["-e", &cleaned_exec]),
            "lxterminal" => ("lxterminal", vec!["-e", &cleaned_exec]),
            "xterm" => ("xterm", vec!["-e", &cleaned_exec]),
            _ => return Err(format!("Unknown terminal emulator: {}", terminal_emulator)),
        };

        eprintln!("Launching in terminal: {} {:?}", cmd, args);

        Command::new(cmd)
            .args(&args)
            .spawn()
            .map_err(|e| format!("Failed to launch application in terminal: {}", e))?;

        Ok(format!(
            "Launched in {}: {}",
            terminal_emulator, cleaned_exec
        ))
    } else {
        // Normal application launch
        Command::new("sh")
            .arg("-c")
            .arg(&cleaned_exec)
            .spawn()
            .map_err(|e| format!("Failed to launch application: {}", e))?;

        Ok(format!("Launched: {}", cleaned_exec))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let win = app.get_webview_window("main").unwrap();
            win.eval("window.location.reload()").unwrap();

            // Setup global hotkey for Alt+Space
            let hotkey_manager = GlobalHotKeyManager::new().unwrap();
            let hotkey = HotKey::new(Some(Modifiers::ALT), Code::Space);

            hotkey_manager.register(hotkey).unwrap();
            eprintln!("Global hotkey Alt+Space registered successfully");

            // Clone app handle for use in the thread
            let app_handle = app.app_handle().clone();

            // Spawn a thread to listen for hotkey events
            std::thread::spawn(move || {
                let receiver = GlobalHotKeyEvent::receiver();
                loop {
                    if let Ok(event) = receiver.recv() {
                        eprintln!("Hotkey event received: {:?}", event);

                        if let Some(window) = app_handle.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                eprintln!("Hiding window");
                                let _ = window.hide();
                            } else {
                                eprintln!("Showing window");
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                }
            });

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
