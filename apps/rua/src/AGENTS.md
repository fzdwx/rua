# FRONTEND APPLICATION SOURCE

**Generated:** 2025-12-29
**Commit:** c6607b2

## OVERVIEW

React 19 frontend for main Tauri app - components, hooks, extension system, UI logic

## WHERE TO LOOK

| Task                         | Location                                     | Notes                               |
| ---------------------------- | -------------------------------------------- | ----------------------------------- |
| Main app logic & routing     | `home/Home.tsx`                              | Action registration, view switching |
| Extension system core        | `contexts/ExtensionSystemContext.tsx`        | Provider, hot reload, lifecycle     |
| Convert extensions → actions | `hooks/useExtensionActions.tsx`              | Manifest + dynamic actions          |
| Extension iframe rendering   | `extension/extension-view/ExtensionView.tsx` | kkrpc RPC, ext:// protocol          |
| Built-in features            | `components/`                                | weather, translate, quick-link      |
| Settings UI                  | `settings/`                                  | Preference forms, sidebar           |
| Application launcher         | `hooks/useApplications.tsx`                  | System app listing                  |
| Theme management             | `hooks/useTheme.tsx`                         | Light/dark/system toggle            |

## CONVENTIONS

**Routing & Navigation:**

- **No React Router**: Uses Tauri window params (`?type=settings`) + internal `rootActionId` state
- **Action-Based Views**: Each action can define its own view component via `viewConfig.ts`
- **Window Focus**: Listen to `tauri://focus` event, not document focus

**Extension System:**

- **Context-Only**: All extension operations via `ExtensionSystemContext`, never direct `invoke()`
- **Hot Reload**: Increment `devRefreshKey` prop triggers extension iframe remount
- **RPC Communication**: kkrpc + custom `ext://` protocol for iframe ↔ main app
- **Background Scripts**: Auto-executed on extension enable, isolated from view scripts

**Tauri Integration:**

- **Command Pattern**: All Rust backend calls via `@tauri-apps/api/core` `invoke()`
- **Window Events**: `rua://window-shown`, `rua://window-hidden`, `rua://system-config-changed`
- **Preference Storage**: `get_preference()` / `set_preference()` with namespace

**State Management:**

- **Action Store**: `@fzdwx/ruaui` `useActionStore()` for command palette state
- **Provider Hierarchy**: ExtensionSystemProvider → WeatherConfigProvider → ActionUsageProvider
- **Usage Tracking**: Action invocation counts stored in localStorage via `ActionUsageContext`

## ANTI-PATTERNS

- **No React Router**: Don't install/use react-router - routing is internal state + Tauri params
- **No Direct Extension Paths**: Never manually construct extension paths - use context helpers
- **No Iframe CSS Imports**: Extension iframes get CSS via RPC collection, not standard imports
- **No Standard React Navigation**: Use `setRootActionId()` for view switching, not Link/Router
- **No Bypassing ExtensionSystem**: Always use context methods for install/enable/disable extensions
- **No Hardcoded Extension URLs**: Use `ext://` protocol with base64-encoded base directory
