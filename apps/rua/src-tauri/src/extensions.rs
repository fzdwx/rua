//! Extension Management Module
//!
//! Handles loading, installing, and managing Rua extensions.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Extension manifest action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestAction {
    pub name: String,
    pub title: String,
    pub mode: String,
    #[serde(default)]
    pub keywords: Vec<String>,
    pub icon: Option<String>,
    pub subtitle: Option<String>,
    pub shortcut: Option<Vec<String>>,
    pub script: Option<String>,
    #[serde(default)]
    pub query: Option<bool>,
}

/// Rua-specific configuration in manifest
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuaConfig {
    #[serde(rename = "engineVersion")]
    pub engine_version: String,
    pub ui: Option<UiConfig>,
    pub init: Option<String>,
    pub actions: Vec<ManifestAction>,
}

/// UI configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiConfig {
    pub entry: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

/// Extension manifest structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub rua: RuaConfig,
    pub description: Option<String>,
    pub author: Option<String>,
    pub homepage: Option<String>,
    pub repository: Option<String>,
    pub keywords: Option<Vec<String>>,
    pub icon: Option<String>,
    pub permissions: Option<Vec<String>>,
    pub dependencies: Option<HashMap<String, String>>,
}

/// Extension info returned to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionInfo {
    pub manifest: ExtensionManifest,
    pub enabled: bool,
    pub loaded: bool,
    pub path: String,
    pub actions: Vec<String>,
    pub error: Option<String>,
}

/// Extension registry state
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RegistryState {
    pub version: u32,
    pub extensions: HashMap<String, ExtensionState>,
}

/// Individual extension state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionState {
    pub id: String,
    pub enabled: bool,
    #[serde(rename = "installedAt")]
    pub installed_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    pub version: String,
}

/// Get the extensions directory path
fn get_extensions_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let extensions_dir = app_data_dir.join("extensions");
    
    // Create directory if it doesn't exist
    if !extensions_dir.exists() {
        fs::create_dir_all(&extensions_dir)
            .map_err(|e| format!("Failed to create extensions dir: {}", e))?;
    }
    
    Ok(extensions_dir)
}

/// Get the registry file path
fn get_registry_path(app: &AppHandle) -> Result<PathBuf, String> {
    let extensions_dir = get_extensions_dir(app)?;
    Ok(extensions_dir.join("registry.json"))
}

/// Load registry state from file
fn load_registry(app: &AppHandle) -> Result<RegistryState, String> {
    let registry_path = get_registry_path(app)?;
    
    if !registry_path.exists() {
        return Ok(RegistryState::default());
    }
    
    let content = fs::read_to_string(&registry_path)
        .map_err(|e| format!("Failed to read registry: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse registry: {}", e))
}

/// Save registry state to file
fn save_registry(app: &AppHandle, state: &RegistryState) -> Result<(), String> {
    let registry_path = get_registry_path(app)?;
    
    let content = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize registry: {}", e))?;
    
    fs::write(&registry_path, content)
        .map_err(|e| format!("Failed to write registry: {}", e))
}

/// Load manifest from extension directory
fn load_manifest(extension_path: &PathBuf) -> Result<ExtensionManifest, String> {
    let manifest_path = extension_path.join("manifest.json");
    
    if !manifest_path.exists() {
        return Err(format!("manifest.json not found in {:?}", extension_path));
    }
    
    let content = fs::read_to_string(&manifest_path)
        .map_err(|e| format!("Failed to read manifest: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse manifest: {}", e))
}

/// Get list of all installed extensions
#[tauri::command]
pub async fn get_extensions(app: AppHandle) -> Result<Vec<ExtensionInfo>, String> {
    let extensions_dir = get_extensions_dir(&app)?;
    let registry = load_registry(&app)?;
    
    let mut extensions = Vec::new();
    
    // Read all subdirectories in extensions folder
    let entries = fs::read_dir(&extensions_dir)
        .map_err(|e| format!("Failed to read extensions dir: {}", e))?;
    
    for entry in entries.flatten() {
        let path = entry.path();
        
        if !path.is_dir() {
            continue;
        }
        
        // Skip registry.json
        if path.file_name().map(|n| n == "registry.json").unwrap_or(false) {
            continue;
        }
        
        match load_manifest(&path) {
            Ok(manifest) => {
                let ext_state = registry.extensions.get(&manifest.id);
                let enabled = ext_state.map(|s| s.enabled).unwrap_or(true);
                
                let action_ids: Vec<String> = manifest
                    .rua
                    .actions
                    .iter()
                    .map(|a| format!("{}.{}", manifest.id, a.name))
                    .collect();
                
                extensions.push(ExtensionInfo {
                    manifest,
                    enabled,
                    loaded: enabled,
                    path: path.to_string_lossy().to_string(),
                    actions: action_ids,
                    error: None,
                });
            }
            Err(e) => {
                // Include failed extensions with error info
                let dir_name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();
                
                extensions.push(ExtensionInfo {
                    manifest: ExtensionManifest {
                        id: dir_name.clone(),
                        name: dir_name,
                        version: "0.0.0".to_string(),
                        rua: RuaConfig {
                            engine_version: "0.0.0".to_string(),
                            ui: None,
                            init: None,
                            actions: vec![],
                        },
                        description: None,
                        author: None,
                        homepage: None,
                        repository: None,
                        keywords: None,
                        icon: None,
                        permissions: None,
                        dependencies: None,
                    },
                    enabled: false,
                    loaded: false,
                    path: path.to_string_lossy().to_string(),
                    actions: vec![],
                    error: Some(e),
                });
            }
        }
    }
    
    Ok(extensions)
}

/// Install extension from a path (copy to extensions directory)
#[tauri::command]
pub async fn install_extension(app: AppHandle, source_path: String) -> Result<ExtensionInfo, String> {
    let source = PathBuf::from(&source_path);
    
    if !source.exists() {
        return Err(format!("Source path does not exist: {}", source_path));
    }
    
    // Load manifest to get extension ID
    let manifest = load_manifest(&source)?;
    let ext_id = &manifest.id;
    
    // Get target directory
    let extensions_dir = get_extensions_dir(&app)?;
    let target = extensions_dir.join(ext_id);
    
    // Remove existing if present
    if target.exists() {
        fs::remove_dir_all(&target)
            .map_err(|e| format!("Failed to remove existing extension: {}", e))?;
    }
    
    // Copy extension directory
    copy_dir_recursive(&source, &target)?;
    
    // Update registry
    let mut registry = load_registry(&app)?;
    let now = chrono::Utc::now().to_rfc3339();
    
    registry.extensions.insert(ext_id.clone(), ExtensionState {
        id: ext_id.clone(),
        enabled: true,
        installed_at: now.clone(),
        updated_at: now,
        version: manifest.version.clone(),
    });
    
    save_registry(&app, &registry)?;
    
    let action_ids: Vec<String> = manifest
        .rua
        .actions
        .iter()
        .map(|a| format!("{}.{}", manifest.id, a.name))
        .collect();
    
    Ok(ExtensionInfo {
        manifest,
        enabled: true,
        loaded: true,
        path: target.to_string_lossy().to_string(),
        actions: action_ids,
        error: None,
    })
}

/// Uninstall an extension
#[tauri::command]
pub async fn uninstall_extension(app: AppHandle, extension_id: String) -> Result<(), String> {
    let extensions_dir = get_extensions_dir(&app)?;
    let ext_path = extensions_dir.join(&extension_id);
    
    if ext_path.exists() {
        fs::remove_dir_all(&ext_path)
            .map_err(|e| format!("Failed to remove extension: {}", e))?;
    }
    
    // Update registry
    let mut registry = load_registry(&app)?;
    registry.extensions.remove(&extension_id);
    save_registry(&app, &registry)?;
    
    Ok(())
}

/// Enable an extension
#[tauri::command]
pub async fn enable_extension(app: AppHandle, extension_id: String) -> Result<(), String> {
    let mut registry = load_registry(&app)?;
    
    if let Some(state) = registry.extensions.get_mut(&extension_id) {
        state.enabled = true;
        state.updated_at = chrono::Utc::now().to_rfc3339();
    } else {
        // Create new state if not exists
        let now = chrono::Utc::now().to_rfc3339();
        registry.extensions.insert(extension_id.clone(), ExtensionState {
            id: extension_id,
            enabled: true,
            installed_at: now.clone(),
            updated_at: now,
            version: "0.0.0".to_string(),
        });
    }
    
    save_registry(&app, &registry)
}

/// Disable an extension
#[tauri::command]
pub async fn disable_extension(app: AppHandle, extension_id: String) -> Result<(), String> {
    let mut registry = load_registry(&app)?;
    
    if let Some(state) = registry.extensions.get_mut(&extension_id) {
        state.enabled = false;
        state.updated_at = chrono::Utc::now().to_rfc3339();
        save_registry(&app, &registry)?;
    }
    
    Ok(())
}

/// Get extensions directory path (for frontend to know where to look)
#[tauri::command]
pub async fn get_extensions_path(app: AppHandle) -> Result<String, String> {
    let path = get_extensions_dir(&app)?;
    Ok(path.to_string_lossy().to_string())
}

/// Load a development extension from a path (without copying)
/// This allows live preview during development
#[tauri::command]
pub async fn load_dev_extension(dev_path: String) -> Result<ExtensionInfo, String> {
    let path = PathBuf::from(&dev_path);
    
    if !path.exists() {
        return Err(format!("Dev path does not exist: {}", dev_path));
    }
    
    let manifest = load_manifest(&path)?;
    
    let action_ids: Vec<String> = manifest
        .rua
        .actions
        .iter()
        .map(|a| format!("{}.{}", manifest.id, a.name))
        .collect();
    
    Ok(ExtensionInfo {
        manifest,
        enabled: true,
        loaded: true,
        path: path.to_string_lossy().to_string(),
        actions: action_ids,
        error: None,
    })
}

/// Helper function to copy directory recursively
fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    
    for entry in fs::read_dir(src)
        .map_err(|e| format!("Failed to read directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)
                .map_err(|e| format!("Failed to copy file: {}", e))?;
        }
    }
    
    Ok(())
}
