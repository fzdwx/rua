# RUST BACKEND

**Generated:** 2025-12-29
**Commit:** c6607b2
**Branch:** main

## OVERVIEW

Tauri v2 Rust backend - platform-specific system integrations, extension runtime, HTTP control server.

## STRUCTURE

```
src/
├── lib.rs                # Main entry, 40+ Tauri commands
├── main.rs               # Entry (windows_subsystem critical)
├── bin/ruactl.rs         # CLI: toggle/health/pack/install/validate
├── linux/                # Linux: .desktop parsing, Hyprland/X11
├── not_linux/            # macOS/Windows stubs
├── extension/            # Plugin load/unload/storage
├── file_search.rs        # Fuzzy search
├── file_watcher.rs       # Directory monitoring
├── fs_api.rs             # Filesystem ops
├── preferences.rs        # Settings persistence
├── system_tray.rs        # Tray icon/menu
└── types.rs              # Shared types
```

**Platform Split:**

- `#[cfg(target_os = "linux")]` - Linux-only modules
- `#[cfg(not(target_os = "linux"))]` - macOS/Windows fallback
- Common APIs exported via `mod.rs` re-exports

**Tauri Commands:** System/clipboard/extensions/files/prefs/window
**CLI Tool:** ruactl toggle/health/pack/validate/install (HTTP POST to 127.0.0.1:7777)

## WHERE TO LOOK

| Task              | Location                 |
| ----------------- | ------------------------ |
| Add Tauri command | lib.rs (register)        |
| Linux integration | linux/\*.rs (new module) |
| Extension hook    | extension/extensions.rs  |
| Window control    | linux/control_server.rs  |
| CLI command       | bin/ruactl.rs (match)    |
| Filesystem op     | fs_api.rs (new fn)       |
| Preference key    | preferences.rs           |
| File watching     | file_watcher.rs          |

## ANTI-PATTERNS

**Critical:**

- main.rs line 2: `windows_subsystem = "windows"` - DO NOT REMOVE, prevents console popup

**Common mistakes:**

- Block main thread → use `tokio::spawn` for async (see lib.rs setup())
- Cross-platform assumptions → Linux modules won't compile on macOS/Windows
- Hardcoded paths → use `std::env::var("HOME")` or Tauri APIs
- Panic in commands → return `Result<_, String>`, not `unwrap()`

**Extension packaging:**

- .ruaignore uses glob patterns (NOT regex)
- Extension ID regex: `^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$` (author.extension-name)
- Storage is per-extension key-value

**Window control:**

- Hyprland: `hyprland::move_to_current_workspace()`
- X11: `x11_window::X11WindowManager`
- Fallback: Tauri window API always runs after platform-specific for sync
