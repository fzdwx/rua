use crate::types::Application;

#[tauri::command]
#[cfg(not(target_os = "linux"))]
pub fn get_applications() -> Vec<Application> {
    // Return empty on non-Linux platforms
    Vec::new()
}

#[tauri::command]
#[cfg(not(target_os = "linux"))]
pub fn refresh_applications_cache() -> Result<String, String> {
    // No-op on non-Linux platforms
    Ok("Cache refresh not supported on this platform".to_string())
}

#[tauri::command]
#[cfg(not(target_os = "linux"))]
pub fn launch_application(_exec: String, _terminal: bool) -> Result<String, String> {
    // Not supported on non-Linux platforms
    Err("Application launch not supported on this platform".to_string())
}
