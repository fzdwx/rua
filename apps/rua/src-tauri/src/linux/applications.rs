use serde::{Deserialize, Serialize};

use crate::types::Application;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use std::time::SystemTime;
use walkdir::WalkDir;

#[cfg(target_os = "linux")]
lazy_static::lazy_static! {
    static ref ICON_CACHE: Mutex<HashMap<String, Option<String>>> = Mutex::new(HashMap::new());
    static ref TERMINAL_EMULATOR: Mutex<Option<String>> = Mutex::new(None);
}

#[derive(Debug, Serialize, Deserialize)]
struct AppCache {
    applications: Vec<Application>,
    timestamp: u64,
}

#[tauri::command]
pub fn get_applications() -> Vec<Application> {
    // Try to load from cache first
    if let Some(cached_apps) = load_cache() {
        return cached_apps;
    }

    eprintln!("Loading applications from disk...");
    let start = std::time::Instant::now();

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

    for dir in &app_dirs {
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

    let duration = start.elapsed();
    eprintln!(
        "Loaded {} applications in {:?}",
        applications.len(),
        duration
    );

    // Save to cache with current timestamp
    if let Some(timestamp) = get_latest_mtime(&app_dirs.iter().map(|s| *s).collect::<Vec<_>>()) {
        save_cache(&applications, timestamp);
    }

    applications
}

#[tauri::command]
pub fn refresh_applications_cache() -> Result<String, String> {
    // Delete the cache file
    let cache_path = get_cache_path();
    if cache_path.exists() {
        std::fs::remove_file(&cache_path).map_err(|e| format!("Failed to remove cache: {}", e))?;
        eprintln!("Cache deleted, will reload on next request");
        Ok("Cache refreshed successfully".to_string())
    } else {
        Ok("No cache to refresh".to_string())
    }
}

#[tauri::command]
pub fn launch_application(exec: String, terminal: bool) -> Result<String, String> {
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
            "wezterm" => ("wezterm", vec!["-e", &cleaned_exec]),
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

/// Get the cache file path
fn get_cache_path() -> PathBuf {
    let cache_dir = std::env::var("XDG_CACHE_HOME")
        .unwrap_or_else(|_| format!("{}/.cache", std::env::var("HOME").unwrap_or_default()));
    let mut path = PathBuf::from(cache_dir);
    path.push("rua");
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path.push("applications.json");
    path
}

/// Get the latest modification time from application directories
fn get_latest_mtime(app_dirs: &[&str]) -> Option<u64> {
    let mut latest: Option<u64> = None;

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
                    if let Ok(metadata) = entry.metadata() {
                        if let Ok(modified) = metadata.modified() {
                            if let Ok(duration) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                                let mtime = duration.as_secs();
                                latest = Some(latest.map_or(mtime, |l| l.max(mtime)));
                            }
                        }
                    }
                }
            }
        }
    }

    latest
}

/// Load applications from cache if valid
fn load_cache() -> Option<Vec<Application>> {
    let cache_path = get_cache_path();
    if !cache_path.exists() {
        eprintln!("Cache file does not exist");
        return None;
    }

    let cache_content = fs::read_to_string(&cache_path).ok()?;
    let cache: AppCache = serde_json::from_str(&cache_content).ok()?;

    // Get current latest mtime
    let home = &format!(
        "{}/.local/share/applications",
        std::env::var("HOME").unwrap_or_default()
    );
    let app_dirs = vec![
        "/usr/share/applications",
        "/usr/local/share/applications",
        home.as_str(),
    ];

    let current_mtime = get_latest_mtime(&app_dirs)?;

    // Check if cache is still valid
    if cache.timestamp >= current_mtime {
        eprintln!(
            "Using cached applications (cache: {}, current: {})",
            cache.timestamp, current_mtime
        );
        Some(cache.applications)
    } else {
        eprintln!(
            "Cache is outdated (cache: {}, current: {})",
            cache.timestamp, current_mtime
        );
        None
    }
}

/// Save applications to cache
fn save_cache(applications: &[Application], timestamp: u64) {
    let cache_path = get_cache_path();
    let cache = AppCache {
        applications: applications.to_vec(),
        timestamp,
    };

    if let Ok(cache_json) = serde_json::to_string(&cache) {
        if let Err(e) = fs::write(&cache_path, cache_json) {
            eprintln!("Failed to write cache: {}", e);
        } else {
            eprintln!("Cache saved successfully to {:?}", cache_path);
        }
    }
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
    let icon = entry
        .icon()
        .and_then(|icon_name| resolve_icon_path(icon_name));

    Ok(Application {
        name,
        exec,
        icon,
        description,
        path: path.to_string_lossy().to_string(),
        terminal,
    })
}
