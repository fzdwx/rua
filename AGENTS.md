# PROJECT KNOWLEDGE BASE

**Generated:** 2025-12-29
**Commit:** c6607b2
**Branch:** main

## OVERVIEW

Tauri-based Linux application launcher with React 19 frontend, Rust v2 backend, extensible plugin system. Monorepo structure (Bun workspaces).

## STRUCTURE

```
rua/
├── apps/
│   ├── rua/              # Main Tauri app (React + Rust)
│   │   ├── src/         # Frontend source
│   │   └── src-tauri/  # Rust backend
│   └── docs/            # Next.js documentation site
├── packages/
│   ├── rua-ui/          # Shared UI component library
│   ├── rua-api/         # Extension API types
│   └── create-rua-ext/  # Extension scaffolding CLI
├── examples/            # Demo extensions
├── justfile             # Build orchestration (NOT Makefile)
└── bump-version.sh      # Multi-file version sync
```

## WHERE TO LOOK

| Task                   | Location                   | Notes                            |
| ---------------------- | -------------------------- | -------------------------------- |
| Add main app feature   | `apps/rua/src/`            | React components + hooks         |
| Add system integration | `apps/rua/src-tauri/src/`  | Rust Tauri commands              |
| Add UI component       | `packages/rua-ui/src/`     | Shared across apps               |
| Create extension       | `packages/create-rua-ext/` | Template system                  |
| Build/deploy           | `justfile`                 | Run `just build`, `just install` |

## CONVENTIONS

**Deviation from standard:**

- **Package Manager**: Bun (NOT npm/yarn)
- **Build System**: `just` command runner (NOT Makefile)
- **Testing**: NONE (no test framework, no test files)
- **Version Sync**: Custom script syncs 6+ files (package.json, Cargo.toml, tauri.conf.json, docs)
- **Install Process**: Temporarily disables Tauri bundling during `just install`

**Standard patterns:**

- Monorepo with `apps/*` and `packages/*` workspaces
- React 19, TypeScript, Tailwind CSS v4
- Shadcn/ui for UI components
- Tauri v2 for desktop app framework

## ANTI-PATTERNS (THIS PROJECT)

- **No Testing**: No test infrastructure whatsoever (Vitest, Jest, Rust tests - none exist)
- **No PR CI**: GitHub Actions only builds on git tags, not pull requests
- **Bundle Toggling**: Install process modifies tauri.conf.json to disable bundling (required for system install)

## UNIQUE STYLES

**Architecture:**

- **Platform Split**: Rust code separated into `src-tauri/src/linux/` and `src-tauri/src/not_linux/`
- **HTTP Control Server**: Built-in server on `127.0.0.1:7777` for `ruactl` CLI tool
- **Hot Reload Extensions**: Extension system supports runtime reloading without restart

**Design System (Raycast Style):**

- **Colors**: CSS variables `--gray1` to `--gray12`, `--primary` (#6ee7b7)
- **Shadows**: Use `shadow-md` for hover effects (NO custom `shadow-raycast` classes)
- **Animations**: `motion/react` (framer-motion fork) with 150-300ms duration
- **Blur**: `backdrop-blur-md` for dropdowns/popovers (NO `backdrop-blur-raycast`)

## COMMANDS

```bash
# Development
bun dev                    # Start Vite dev server (http://localhost:1421)
bun tauri                  # Start Tauri in dev mode

# Building
bun x tsc --noEmit        # Type check without emitting
bun run build              # Frontend build
just build                 # Full build (Vite + Tauri)
just install               # System install (bundle toggle + install both app + CLI)

# Format
bun run format             # Format all TS/TSX/Rust files
cargo fmt --check         # Check Rust formatting

# ruactl (CLI control)
ruactl toggle             # Toggle window visibility
ruactl health             # Check if running
```

## NOTES

**Critical Requirements:**

- **main.rs Windows Fix**: `#![windows_subsystem = "windows"]` prevents console windows - DO NOT REMOVE
- **Hyprland Hotkey**: Use `ruactl toggle` bound to Alt+Space in Hyprland config (NOT Tauri global shortcuts)

**Gotchas:**

- **Bun Required**: Project uses Bun as package manager, NOT npm/yarn
- **No LSP Setup**: TypeScript LSP not installed - use `bun x tsc --noEmit` for type checking
- **Version Bumping**: Use `just bump <version>` to sync versions across all packages automatically
- **Extension Dev**: Use `bunx create-rua-ext <name>` to scaffold new extension
- **Build Artifacts**: Ignore `apps/rua/src-tauri/target/` and `.next/` directories (auto-generated)
