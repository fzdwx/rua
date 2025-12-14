use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::process;

use regex::Regex;
use serde::Deserialize;
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

const SERVER_URL: &str = "http://127.0.0.1:7777";
const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Default ignore patterns when no .ruaignore file exists
const DEFAULT_IGNORE_PATTERNS: &[&str] = &[
    "node_modules",
    ".git",
    ".DS_Store",
    "*.log",
    ".env",
    ".env.*",
    "src",
    "tsconfig.json",
    "vite.config.*",
    "package-lock.json",
    "bun.lock",
    "yarn.lock",
    ".ruaignore",
];

#[derive(Deserialize)]
struct Response {
    success: bool,
    message: String,
}

#[derive(Deserialize, Debug)]
struct ExtensionManifest {
    id: String,
    name: String,
    version: String,
    rua: RuaConfig,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct RuaConfig {
    engine_version: String,
    ui: Option<UiConfig>,
    actions: Vec<ManifestAction>,
}

#[derive(Deserialize, Debug)]
struct UiConfig {
    entry: String,
}

#[derive(Deserialize, Debug)]
struct ManifestAction {
    name: String,
    title: String,
    mode: String,
    script: Option<String>,
}

struct FileInfo {
    path: String,
    size: u64,
}

fn send_request(endpoint: &str) -> Result<Response, Box<dyn std::error::Error>> {
    let url = format!("{}{}", SERVER_URL, endpoint);
    let client = reqwest::blocking::Client::new();
    let response = client.post(&url).send()?;
    let response_data: Response = response.json()?;
    Ok(response_data)
}

fn toggle() {
    match send_request("/toggle") {
        Ok(resp) => {
            if resp.success {
                println!("{}", resp.message);
                process::exit(0);
            } else {
                eprintln!("Error: {}", resp.message);
                process::exit(1);
            }
        }
        Err(e) => {
            eprintln!("Failed to connect to rua: {}", e);
            eprintln!("Make sure rua is running.");
            process::exit(1);
        }
    }
}

fn health() {
    match send_request("/health") {
        Ok(resp) => {
            if resp.success {
                println!("✓ {}", resp.message);
                process::exit(0);
            } else {
                eprintln!("Error: {}", resp.message);
                process::exit(1);
            }
        }
        Err(e) => {
            eprintln!("Failed to connect to rua: {}", e);
            eprintln!("Make sure rua is running.");
            process::exit(1);
        }
    }
}

fn print_usage() {
    println!("ruactl - Control utility for Rua");
    println!();
    println!("USAGE:");
    println!("    ruactl <COMMAND> [OPTIONS]");
    println!();
    println!("COMMANDS:");
    println!("    toggle              Toggle window visibility");
    println!("    health              Check if Rua is running");
    println!("    pack [path]         Package extension into .rua format");
    println!("    validate [path]     Validate extension manifest");
    println!("    install <source>    Install extension from GitHub or local .rua file");
    println!("    help                Print this help message");
    println!();
    println!("INSTALL SOURCES:");
    println!("    github:owner/repo   Install latest release from GitHub");
    println!("    github:owner/repo@v1.0.0  Install specific version from GitHub");
    println!("    /path/to/ext.rua    Install from local .rua file");
    println!();
    println!("OPTIONS:");
    println!("    --dry-run           (pack) List files without creating archive");
    println!("    -h, --help          Print help information");
    println!("    -v, --version       Print version information");
}

/// Validate extension ID format: author.extension-name
fn validate_extension_id(id: &str) -> bool {
    let re = Regex::new(r"^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$").unwrap();
    re.is_match(id)
}

/// Parse and validate manifest.json
fn parse_manifest(dir: &Path) -> Result<ExtensionManifest, Vec<String>> {
    let manifest_path = dir.join("manifest.json");

    if !manifest_path.exists() {
        return Err(vec![format!(
            "manifest.json not found in {}",
            dir.display()
        )]);
    }

    let content = match fs::read_to_string(&manifest_path) {
        Ok(c) => c,
        Err(e) => return Err(vec![format!("Failed to read manifest.json: {}", e)]),
    };

    let manifest: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(e) => return Err(vec![format!("Failed to parse manifest.json: {}", e)]),
    };

    let mut errors = Vec::new();

    // Validate required fields
    if manifest.get("id").and_then(|v| v.as_str()).is_none() {
        errors.push("Missing required field: id".to_string());
    } else if let Some(id) = manifest.get("id").and_then(|v| v.as_str()) {
        if !validate_extension_id(id) {
            errors.push("Invalid extension id format. Expected: author.extension-name".to_string());
        }
    }

    if manifest.get("name").and_then(|v| v.as_str()).is_none() {
        errors.push("Missing required field: name".to_string());
    }

    if manifest.get("version").and_then(|v| v.as_str()).is_none() {
        errors.push("Missing required field: version".to_string());
    }

    let rua = manifest.get("rua");
    if rua.is_none() {
        errors.push("Missing required field: rua".to_string());
    } else if let Some(rua) = rua {
        if rua.get("engineVersion").and_then(|v| v.as_str()).is_none() {
            errors.push("Missing required field: rua.engineVersion".to_string());
        }

        match rua.get("actions").and_then(|v| v.as_array()) {
            None => errors.push("Missing required field: rua.actions".to_string()),
            Some(actions) if actions.is_empty() => {
                errors.push("rua.actions must contain at least one action".to_string())
            }
            Some(actions) => {
                for (i, action) in actions.iter().enumerate() {
                    if action.get("name").and_then(|v| v.as_str()).is_none() {
                        errors.push(format!("Missing required field: rua.actions[{}].name", i));
                    }
                    if action.get("title").and_then(|v| v.as_str()).is_none() {
                        errors.push(format!("Missing required field: rua.actions[{}].title", i));
                    }
                    let mode = action.get("mode").and_then(|v| v.as_str());
                    if mode.is_none() || (mode != Some("view") && mode != Some("command")) {
                        errors.push(format!(
                            "Invalid or missing field: rua.actions[{}].mode (must be 'view' or 'command')",
                            i
                        ));
                    }
                }
            }
        }
    }

    if !errors.is_empty() {
        return Err(errors);
    }

    // Parse into struct
    match serde_json::from_str::<ExtensionManifest>(&content) {
        Ok(m) => Ok(m),
        Err(e) => Err(vec![format!("Failed to deserialize manifest: {}", e)]),
    }
}

/// Get referenced files from manifest (ui.entry, action scripts)
fn get_referenced_files(manifest: &ExtensionManifest) -> Vec<String> {
    let mut files = Vec::new();

    if let Some(ui) = &manifest.rua.ui {
        files.push(ui.entry.clone());
    }

    for action in &manifest.rua.actions {
        if let Some(script) = &action.script {
            files.push(script.clone());
        }
    }

    files
}

/// Load ignore patterns from .ruaignore or use defaults
fn load_ignore_patterns(dir: &Path) -> Vec<glob::Pattern> {
    let ruaignore_path = dir.join(".ruaignore");
    let patterns_str: Vec<String>;

    if ruaignore_path.exists() {
        if let Ok(file) = File::open(&ruaignore_path) {
            let reader = BufReader::new(file);
            patterns_str = reader
                .lines()
                .filter_map(|l| l.ok())
                .map(|l| l.trim().to_string())
                .filter(|l| !l.is_empty() && !l.starts_with('#'))
                .collect();
        } else {
            patterns_str = DEFAULT_IGNORE_PATTERNS.iter().map(|s| s.to_string()).collect();
        }
    } else {
        patterns_str = DEFAULT_IGNORE_PATTERNS.iter().map(|s| s.to_string()).collect();
    }

    patterns_str
        .iter()
        .filter_map(|p| glob::Pattern::new(p).ok())
        .collect()
}

/// Check if a path matches any ignore pattern
fn should_ignore(path: &str, patterns: &[glob::Pattern]) -> bool {
    for pattern in patterns {
        if pattern.matches(path) || pattern.matches_path(Path::new(path)) {
            return true;
        }
        // Also check if any component matches
        for component in Path::new(path).components() {
            if let std::path::Component::Normal(name) = component {
                if let Some(name_str) = name.to_str() {
                    if pattern.matches(name_str) {
                        return true;
                    }
                }
            }
        }
    }
    false
}

/// Collect files to include in the package
fn collect_files(
    dir: &Path,
    patterns: &[glob::Pattern],
    always_include: &HashSet<String>,
) -> Result<Vec<FileInfo>, String> {
    let mut files = Vec::new();
    collect_files_recursive(dir, dir, patterns, always_include, &mut files)?;
    Ok(files)
}

fn collect_files_recursive(
    base_dir: &Path,
    current_dir: &Path,
    patterns: &[glob::Pattern],
    always_include: &HashSet<String>,
    files: &mut Vec<FileInfo>,
) -> Result<(), String> {
    let entries = fs::read_dir(current_dir)
        .map_err(|e| format!("Failed to read directory {}: {}", current_dir.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let relative_path = path
            .strip_prefix(base_dir)
            .unwrap()
            .to_string_lossy()
            .to_string();

        if path.is_dir() {
            // Check if directory should be ignored
            if !should_ignore(&relative_path, patterns) {
                collect_files_recursive(base_dir, &path, patterns, always_include, files)?;
            }
        } else if path.is_file() {
            // Always include manifest.json and referenced files
            let should_include =
                always_include.contains(&relative_path) || !should_ignore(&relative_path, patterns);

            if should_include {
                let metadata = fs::metadata(&path)
                    .map_err(|e| format!("Failed to get metadata for {}: {}", path.display(), e))?;
                files.push(FileInfo {
                    path: relative_path,
                    size: metadata.len(),
                });
            }
        }
    }

    Ok(())
}

/// Format file size for display
fn format_size(bytes: u64) -> String {
    if bytes < 1024 {
        format!("{} B", bytes)
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
    }
}

/// Validate command
fn validate(path: Option<&str>) {
    let dir = PathBuf::from(path.unwrap_or("."));
    let abs_dir = fs::canonicalize(&dir).unwrap_or(dir.clone());

    println!("ℹ Validating manifest in {}", abs_dir.display());

    match parse_manifest(&abs_dir) {
        Ok(manifest) => {
            println!("✓ Manifest is valid");
            println!("  Extension: {} ({})", manifest.name, manifest.id);
            println!("  Version: {}", manifest.version);
            println!("  Engine: {}", manifest.rua.engine_version);
            println!("  Actions: {}", manifest.rua.actions.len());
            process::exit(0);
        }
        Err(errors) => {
            eprintln!("✗ Manifest validation failed:");
            for error in errors {
                eprintln!("  - {}", error);
            }
            process::exit(1);
        }
    }
}

/// Pack command
fn pack(path: Option<&str>, dry_run: bool) {
    let dir = PathBuf::from(path.unwrap_or("."));
    let abs_dir = fs::canonicalize(&dir).unwrap_or(dir.clone());

    if dry_run {
        println!(
            "ℹ Dry run: listing files that would be packaged from {}",
            abs_dir.display()
        );
    } else {
        println!("ℹ Packaging extension from {}", abs_dir.display());
    }

    // Parse and validate manifest
    let manifest = match parse_manifest(&abs_dir) {
        Ok(m) => m,
        Err(errors) => {
            eprintln!("✗ Manifest validation failed:");
            for error in errors {
                eprintln!("  - {}", error);
            }
            process::exit(1);
        }
    };

    // Build always-include set
    let mut always_include: HashSet<String> = HashSet::new();
    always_include.insert("manifest.json".to_string());
    for file in get_referenced_files(&manifest) {
        always_include.insert(file);
    }

    // Verify referenced files exist
    for file in &always_include {
        let file_path = abs_dir.join(file);
        if !file_path.exists() && file != "manifest.json" {
            eprintln!("✗ Referenced file not found: {}", file);
            process::exit(1);
        }
    }

    // Load ignore patterns and collect files
    let patterns = load_ignore_patterns(&abs_dir);
    let files = match collect_files(&abs_dir, &patterns, &always_include) {
        Ok(f) => f,
        Err(e) => {
            eprintln!("✗ Failed to collect files: {}", e);
            process::exit(1);
        }
    };

    if files.is_empty() {
        eprintln!("✗ No files to pack");
        process::exit(1);
    }

    let total_size: u64 = files.iter().map(|f| f.size).sum();
    let output_filename = format!("{}-{}.rua", manifest.id, manifest.version);
    let output_path = abs_dir.join(&output_filename);

    if dry_run {
        println!();
        println!("Files to be included:");
        for file in &files {
            println!("  {} ({})", file.path, format_size(file.size));
        }
        println!();
        println!("ℹ Total: {} files, {}", files.len(), format_size(total_size));
        println!("ℹ Output would be: {}", output_path.display());
        process::exit(0);
    }

    // Create the archive
    let file = match File::create(&output_path) {
        Ok(f) => f,
        Err(e) => {
            eprintln!("✗ Cannot write to output file: {}", e);
            process::exit(1);
        }
    };

    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .compression_level(Some(9));

    for file_info in &files {
        let file_path = abs_dir.join(&file_info.path);
        let content = match fs::read(&file_path) {
            Ok(c) => c,
            Err(e) => {
                eprintln!("✗ Failed to read file {}: {}", file_info.path, e);
                process::exit(1);
            }
        };

        if let Err(e) = zip.start_file(&file_info.path, options) {
            eprintln!("✗ Failed to add file to archive: {}", e);
            process::exit(1);
        }

        if let Err(e) = zip.write_all(&content) {
            eprintln!("✗ Failed to write file content: {}", e);
            process::exit(1);
        }
    }

    if let Err(e) = zip.finish() {
        eprintln!("✗ Failed to finalize archive: {}", e);
        process::exit(1);
    }

    // Get final archive size
    let archive_size = fs::metadata(&output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    println!("✓ Package created successfully");
    println!("  Output: {}", output_path.display());
    println!("  Files: {}", files.len());
    println!("  Size: {}", format_size(archive_size));
    process::exit(0);
}

/// Get extensions directory
fn get_extensions_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|_| "HOME not set")?;
    let extensions_dir = PathBuf::from(home)
        .join(".local/share/like.rua.ai/extensions");
    
    if !extensions_dir.exists() {
        fs::create_dir_all(&extensions_dir)
            .map_err(|e| format!("Failed to create extensions dir: {}", e))?;
    }
    
    Ok(extensions_dir)
}

/// GitHub release asset info
#[derive(Deserialize, Debug)]
struct GitHubAsset {
    name: String,
    browser_download_url: String,
}

/// GitHub release info
#[derive(Deserialize, Debug)]
struct GitHubRelease {
    tag_name: String,
    assets: Vec<GitHubAsset>,
}

/// Parse GitHub source string (github:owner/repo or github:owner/repo@version)
fn parse_github_source(source: &str) -> Option<(String, String, Option<String>)> {
    let source = source.strip_prefix("github:")?;
    
    let (repo_part, version) = if let Some(idx) = source.find('@') {
        let (repo, ver) = source.split_at(idx);
        (repo, Some(ver[1..].to_string()))
    } else {
        (source, None)
    };
    
    let parts: Vec<&str> = repo_part.split('/').collect();
    if parts.len() != 2 {
        return None;
    }
    
    Some((parts[0].to_string(), parts[1].to_string(), version))
}

/// Download file from URL
fn download_file(url: &str) -> Result<Vec<u8>, String> {
    let client = reqwest::blocking::Client::builder()
        .user_agent("ruactl")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    
    let response = client.get(url).send()
        .map_err(|e| format!("Failed to download: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Download failed with status: {}", response.status()));
    }
    
    response.bytes()
        .map(|b| b.to_vec())
        .map_err(|e| format!("Failed to read response: {}", e))
}

/// Fetch GitHub release info
fn fetch_github_release(owner: &str, repo: &str, version: Option<&str>) -> Result<GitHubRelease, String> {
    let url = match version {
        Some(v) => format!("https://api.github.com/repos/{}/{}/releases/tags/{}", owner, repo, v),
        None => format!("https://api.github.com/repos/{}/{}/releases/latest", owner, repo),
    };
    
    let client = reqwest::blocking::Client::builder()
        .user_agent("ruactl")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    
    let response = client.get(&url).send()
        .map_err(|e| format!("Failed to fetch release info: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Failed to fetch release: {}", response.status()));
    }
    
    response.json::<GitHubRelease>()
        .map_err(|e| format!("Failed to parse release info: {}", e))
}

/// Extract .rua archive to extensions directory
fn extract_rua_archive(archive_data: &[u8], extensions_dir: &Path) -> Result<String, String> {
    let cursor = std::io::Cursor::new(archive_data);
    let mut archive = ZipArchive::new(cursor)
        .map_err(|e| format!("Failed to open archive: {}", e))?;
    
    // First, read manifest.json to get extension ID
    let manifest_content = {
        let mut manifest_file = archive.by_name("manifest.json")
            .map_err(|_| "manifest.json not found in archive")?;
        let mut content = String::new();
        manifest_file.read_to_string(&mut content)
            .map_err(|e| format!("Failed to read manifest: {}", e))?;
        content
    };
    
    let manifest: serde_json::Value = serde_json::from_str(&manifest_content)
        .map_err(|e| format!("Failed to parse manifest: {}", e))?;
    
    let ext_id = manifest.get("id")
        .and_then(|v| v.as_str())
        .ok_or("Extension ID not found in manifest")?;
    
    let target_dir = extensions_dir.join(ext_id);
    
    // Remove existing if present
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir)
            .map_err(|e| format!("Failed to remove existing extension: {}", e))?;
    }
    
    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("Failed to create extension dir: {}", e))?;
    
    // Extract all files
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Failed to read archive entry: {}", e))?;
        
        let file_path = match file.enclosed_name() {
            Some(p) => target_dir.join(p),
            None => continue,
        };
        
        if file.is_dir() {
            fs::create_dir_all(&file_path)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        } else {
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create parent directory: {}", e))?;
            }
            
            let mut outfile = File::create(&file_path)
                .map_err(|e| format!("Failed to create file: {}", e))?;
            
            std::io::copy(&mut file, &mut outfile)
                .map_err(|e| format!("Failed to write file: {}", e))?;
        }
    }
    
    Ok(ext_id.to_string())
}

/// Install command
fn install(source: &str) {
    println!("ℹ Installing extension from {}", source);
    
    let extensions_dir = match get_extensions_dir() {
        Ok(d) => d,
        Err(e) => {
            eprintln!("✗ {}", e);
            process::exit(1);
        }
    };
    
    let archive_data: Vec<u8>;
    let source_desc: String;
    
    if source.starts_with("github:") {
        // GitHub source
        let (owner, repo, version) = match parse_github_source(source) {
            Some(v) => v,
            None => {
                eprintln!("✗ Invalid GitHub source format. Use: github:owner/repo or github:owner/repo@version");
                process::exit(1);
            }
        };
        
        println!("  Fetching release info from {}/{}...", owner, repo);
        
        let release = match fetch_github_release(&owner, &repo, version.as_deref()) {
            Ok(r) => r,
            Err(e) => {
                eprintln!("✗ {}", e);
                process::exit(1);
            }
        };
        
        // Find .rua asset
        let rua_asset = release.assets.iter()
            .find(|a| a.name.ends_with(".rua"));
        
        let asset = match rua_asset {
            Some(a) => a,
            None => {
                eprintln!("✗ No .rua file found in release {}", release.tag_name);
                process::exit(1);
            }
        };
        
        println!("  Downloading {}...", asset.name);
        
        archive_data = match download_file(&asset.browser_download_url) {
            Ok(d) => d,
            Err(e) => {
                eprintln!("✗ {}", e);
                process::exit(1);
            }
        };
        
        source_desc = format!("{}/{} {}", owner, repo, release.tag_name);
    } else if source.ends_with(".rua") {
        // Local .rua file
        let path = PathBuf::from(source);
        if !path.exists() {
            eprintln!("✗ File not found: {}", source);
            process::exit(1);
        }
        
        archive_data = match fs::read(&path) {
            Ok(d) => d,
            Err(e) => {
                eprintln!("✗ Failed to read file: {}", e);
                process::exit(1);
            }
        };
        
        source_desc = path.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| source.to_string());
    } else {
        eprintln!("✗ Unknown source format. Use github:owner/repo or path/to/extension.rua");
        process::exit(1);
    }
    
    println!("  Extracting...");
    
    let ext_id = match extract_rua_archive(&archive_data, &extensions_dir) {
        Ok(id) => id,
        Err(e) => {
            eprintln!("✗ {}", e);
            process::exit(1);
        }
    };
    
    println!("✓ Extension installed successfully");
    println!("  ID: {}", ext_id);
    println!("  Source: {}", source_desc);
    println!("  Location: {}", extensions_dir.join(&ext_id).display());
    process::exit(0);
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        print_usage();
        process::exit(1);
    }

    match args[1].as_str() {
        "toggle" => toggle(),
        "health" => health(),
        "validate" => {
            let path = args.get(2).map(|s| s.as_str());
            validate(path);
        }
        "pack" => {
            let mut path: Option<&str> = None;
            let mut dry_run = false;

            for arg in args.iter().skip(2) {
                match arg.as_str() {
                    "--dry-run" => dry_run = true,
                    s if !s.starts_with('-') => path = Some(s),
                    _ => {}
                }
            }

            pack(path, dry_run);
        }
        "install" => {
            let source = args.get(2);
            match source {
                Some(s) => install(s),
                None => {
                    eprintln!("✗ Missing source argument");
                    eprintln!("Usage: ruactl install github:owner/repo");
                    eprintln!("       ruactl install /path/to/extension.rua");
                    process::exit(1);
                }
            }
        }
        "help" | "--help" | "-h" => {
            print_usage();
            process::exit(0);
        }
        "-v" | "--version" => {
            println!("ruactl {}", VERSION);
            process::exit(0);
        }
        cmd => {
            eprintln!("Unknown command: {}", cmd);
            eprintln!();
            print_usage();
            process::exit(1);
        }
    }
}
