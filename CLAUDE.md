# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rua is a Tauri-based application launcher for Linux, built with React, TypeScript, and Rust. It provides a command palette interface for searching and launching applications installed on the system.

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Tauri v2, Rust
- **Styling**: UnoCSS, Radix UI Themes
- **State Management**: Custom hooks with Zustand-like patterns
- **Search**: Fuse.js for fuzzy matching

## Development Commands

```bash
# Development
pnpm dev                    # Start Vite dev server
pnpm tauri dev             # Start Tauri app in dev mode

# Build
pnpm build                 # Build frontend (TypeScript check + Vite build)
pnpm tauri build          # Build Tauri application

# Preview
pnpm preview              # Preview production build
```

## Linux Environment Variables

When running on Linux with certain graphics issues, you may need:
```bash
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export WEBKIT_DISABLE_COMPOSITING_MODE=1
```

## Architecture

### Frontend Architecture

The application uses a custom command palette system inspired by kbar:

1. **Action System** (`src/command/action/`):
   - `ActionInterface.ts` - Manages action registration and hierarchies
   - `ActionImpl.ts` - Implementation of individual actions with parent-child relationships
   - `Command.ts` - Core command execution logic
   - `HistoryImpl.ts` - Command history management

2. **Action Store** (`src/command/useActionStore.tsx`):
   - Central state management for actions using a custom hook
   - Handles action registration, current root action, and active index
   - Similar to Zustand pattern but specialized for command palette

3. **Matching & Search** (`src/command/useMatches.tsx`):
   - Uses Fuse.js for fuzzy search across actions
   - Searches action names, keywords, and subtitles
   - Groups results by section with priority sorting

4. **Main Application Flow** (`src/home/Index.tsx`):
   - Combines built-in actions (translate, theme toggle) with system applications
   - Manages search state, active action, and result handling
   - Coordinates between Input, ResultsRender, Footer, and custom views

### Backend Architecture (Rust)

Located in `src-tauri/src/lib.rs`:

1. **Application Discovery**:
   - Scans `.desktop` files from system directories
   - Parses using `freedesktop-desktop-entry` crate
   - Caches icon lookups for performance
   - Handles icon resolution from multiple system paths

2. **Application Launch**:
   - Supports both GUI and terminal applications
   - Auto-detects terminal emulator (konsole, gnome-terminal, alacritty, etc.)
   - Cleans exec commands (removes field codes like %f, %u)

3. **Tauri Commands**:
   - `get_applications()` - Returns all desktop applications
   - `launch_application(exec, terminal)` - Launches app and hides window

### Key Components

- **Input** (`src/command/Input.tsx`): Main search input with breadcrumb navigation
- **ResultsRender** (`src/command/ResultsRender.tsx`): Virtualized list of results using @tanstack/react-virtual
- **RenderItem** (`src/command/RenderItem.tsx`): Individual action item renderer
- **Footer** (`src/command/Footer.tsx`): Context-aware footer with dynamic actions
- **QuickResult** (`src/home/QuickResult.tsx`): Displays quick calculations/results
- **TranslateView** (`src/home/TranslateView.tsx`): Custom view for translation action

### Action Types

Actions follow this interface (`src/command/types.ts`):
```typescript
{
  id: string              // Unique identifier
  name: string            // Display name
  icon?: ReactElement     // Optional icon
  subtitle?: string       // Description text
  keywords?: string       // Search keywords
  section?: string        // Grouping section
  priority?: number       // Sort priority
  parent?: string         // Parent action ID for nested actions
  query?: boolean         // Shows query input when active
  perform?: () => void    // Action handler
  footerAction?: () => Action[]  // Dynamic footer actions
}
```

### Built-in Actions

Defined in `src/home/useBuiltInActions.tsx`:
- **Translate**: Multi-language translation with language selection
- **Theme Toggle**: Available via footer on any screen

### Application Actions

Generated from system `.desktop` files via `src/home/useApplications.tsx`:
- Loaded via Tauri command `get_applications()`
- Icons converted using `convertFileSrc()` for Tauri asset protocol
- Launch triggers window hide after execution

## File Organization

```
src/
├── command/           # Command palette system
│   ├── action/       # Action management classes
│   ├── types.ts      # Type definitions
│   ├── useActionStore.tsx
│   ├── useMatches.tsx
│   ├── Input.tsx
│   ├── ResultsRender.tsx
│   ├── RenderItem.tsx
│   └── Footer.tsx
├── home/             # Main application views
│   ├── Index.tsx     # Main component
│   ├── useApplications.tsx
│   ├── useBuiltInActions.tsx
│   ├── useTheme.tsx
│   ├── QuickResult.tsx
│   └── TranslateView.tsx
└── assets/           # CSS and static files

src-tauri/src/
├── lib.rs           # Main Rust logic
└── main.rs          # Entry point
```

## Important Patterns

1. **Action Registration**: Use `useRegisterActions()` to add/remove actions dynamically
2. **Root Action**: The currently active parent action (null = top level)
3. **Active Index**: Currently highlighted item in results
4. **Footer Actions**: Context-sensitive actions that change based on active main action
5. **Result Handling**: Use `setResultHandleEvent` to enable/disable keyboard handling

## Workflow Requirements

1. **Auto-commit new files**: All newly generated files must be added to git automatically
2. **Clean up unused files**: Remove files that are no longer needed promptly
