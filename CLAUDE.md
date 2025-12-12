# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rua is a Tauri-based application launcher for Linux, built with React, TypeScript, and Rust. It provides a command
palette interface for searching and launching applications installed on the system.

## Technology Stack

UI 组件必须使用 Shadcn,要做到现代化，简约风格

- **Frontend**: React 19, TypeScript, Vite, Shadcn
- **Backend**: Tauri v2, Rust
- **Styling**: Tailwind CSS (v4), @iconify/react for icons
- **State Management**: React Context API for global state
- **Search**: Fuse.js for fuzzy matching
- **HTTP**: Tauri plugin-http, reqwest (Rust) for proxy support

## Development Commands

```bash
# Development
bun dev                    # Start Vite dev server (runs on http://localhost:1421)
bun tauri                  # Start Tauri app in dev mode

# Type Checking & Build
bun x tsc --noEmit        # Check TypeScript without emitting files
bun run build             # Build frontend (TypeScript check + Vite build)
bun tauri-build           # Build Tauri application
just build                # Alternative: Build using justfile
cargo check --manifest-path src-tauri/Cargo.toml  # Check Rust compilation

# ruactl - Control Utility
cargo build --manifest-path src-tauri/Cargo.toml --bin ruactl  # Build ruactl
cargo build --manifest-path src-tauri/Cargo.toml --bin ruactl --release  # Build ruactl (optimized)
./install-ruactl.sh       # Install ruactl to ~/.local/bin
just install              # Install both rua and ruactl to /usr/bin (requires sudo)
ruactl toggle             # Toggle window visibility (after installation)
ruactl health             # Check if rua is running

# Version Management
just bump <version>       # Bump version number (runs bump-version.sh)
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

4. **Main Application Flow** (`src/home/Home.tsx`):
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
    - `refresh_applications_cache()` - Clears cached application data, forcing reload on next request

4. **Application Caching**:
    - Desktop applications are cached in `$XDG_CACHE_HOME/rua/applications.json` (defaults to `~/.cache/rua/`)
    - Cache is invalidated automatically when `.desktop` files are modified
    - Cache includes timestamp-based validation against file modification times
    - Icon paths are cached in-memory using `lazy_static` for performance

### Key Components

- **Input** (`src/command/Input.tsx`): Main search input with breadcrumb navigation
- **ResultsRender** (`src/command/ResultsRender.tsx`): Virtualized list of results using @tanstack/react-virtual
- **RenderItem** (`src/command/RenderItem.tsx`): Individual action item renderer
- **Footer** (`src/command/Footer.tsx`): Context-aware footer with dynamic actions
- **QuickResult** (`src/home/QuickResult.tsx`): Displays quick calculations/results
- **Index** (`src/home/index.tsx`): Custom view for translation action

### Action Types

Actions follow this interface (`src/command/types.ts`):

```typescript
{
    id: string              // Unique identifier
    name: string            // Display name
    icon ? : ReactElement     // Optional icon
    subtitle ? : string       // Description text
    keywords ? : string       // Search keywords
    section ? : string        // Grouping section
    priority ? : number       // Sort priority
    parent ? : string         // Parent action ID for nested actions
    query ? : boolean         // Shows query input when active
    perform ? : () => void    // Action handler
        footerAction ? : () => Action[]  // Dynamic footer actions
}
```

### Built-in Actions

Defined in `src/hooks/useBuiltInActions.tsx`:

- **Translate**: Multi-language translation with language selection
- **Theme Toggle**: Available via footer on any screen

### Application Actions

Generated from system `.desktop` files via `src/hooks/useApplications.tsx`:

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
├── components/        # Reusable UI components
│   ├── QuickResult.tsx
│   └── Index.tsx
├── hooks/            # Custom React hooks
│   ├── useApplications.tsx
│   ├── useBuiltInActions.tsx
│   └── useTheme.tsx
├── home/             # Main application views
│   └── Home.tsx     # Main component
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
6. 前端样式使用 tailwindcss

## Frontend Development Standards

### Design System (Raycast Style)

项目采用 Raycast 风格的设计系统，追求现代化、简约的视觉风格。

#### 1. UI 组件库

- **必须使用 shadcn/ui 组件**：所有 UI 组件应使用 `src/components/ui/` 下的 shadcn/ui 组件
- **禁止使用内联样式**：所有样式必须使用 Tailwind CSS 类名
- **组件位置**：`src/command/` 目录下的组件保持原有样式，不进行优化

#### 2. 颜色系统

颜色系统基于 CSS 变量，支持深色模式自动切换：

```typescript
// 使用 Tailwind 类名引用 CSS 变量
bg-[var(--gray3)]        // 背景色
text-gray-11             // 文本色（映射到 var(--gray11)）
border-[var(--gray6)]    // 边框色
```

**颜色层级**：
- `gray-1` 到 `gray-12`：灰度色阶（1 最浅，12 最深）
- `grayA-1` 到 `grayA-12`：带透明度的灰度
- `blue-1` 到 `blue-12`：蓝色色阶
- `primary`：主色调（#6ee7b7）
- `primary-2`：主色调变体（#30ab7a）

**使用规范**：
- 背景色：使用 `bg-[var(--gray3)]` 或 `bg-gray-3`（推荐直接使用 CSS 变量）
- 文本色：使用 `text-gray-11` 或 `text-[var(--gray11)]`
- 边框色：使用 `border-[var(--gray6)]` 或 `border-gray-6`
- Hover 状态：使用 `hover:bg-[var(--gray4)]`

#### 3. 阴影系统

使用 Raycast 风格的精致阴影：

```typescript
shadow-raycast          // 基础阴影
shadow-raycast-sm       // 小阴影
shadow-raycast-md       // 中等阴影
shadow-raycast-lg       // 大阴影
shadow-raycast-hover    // Hover 状态的阴影增强
```

**使用场景**：
- Card 组件：默认使用 `shadow-raycast`，hover 时使用 `hover:shadow-raycast-hover`
- 弹出层（Select、Popover）：使用 `shadow-raycast-md`
- 按钮：hover 时使用 `hover:shadow-raycast-hover`

#### 4. 圆角系统

统一的圆角值：

```typescript
rounded-raycast         // 0.5rem (8px) - 默认圆角
rounded-raycast-sm      // 0.375rem (6px)
rounded-raycast-md      // 0.625rem (10px)
rounded-raycast-lg      // 0.75rem (12px)
```

**使用规范**：
- Card 组件：使用 `rounded-raycast`
- 按钮：使用 `rounded-md`（shadcn/ui 默认）
- 输入框：使用 `rounded-md`

#### 5. 过渡动画

统一的过渡时间和缓动函数：

```typescript
duration-raycast-fast   // 150ms - 快速交互
duration-raycast        // 200ms - 标准过渡
duration-raycast-slow   // 300ms - 慢速过渡
```

**使用规范**：
- 按钮、输入框：使用 `transition-all duration-raycast-fast`
- Card hover：使用 `transition-all duration-raycast`
- 页面切换：使用 `duration-raycast` 或 `duration-raycast-slow`

#### 6. 模糊效果

弹出层使用 backdrop blur：

```typescript
backdrop-blur-raycast      // 12px
backdrop-blur-raycast-sm   // 8px
backdrop-blur-raycast-lg   // 16px
```

**使用场景**：
- Select 下拉菜单：使用 `backdrop-blur-raycast`
- Popover、Modal：使用 `backdrop-blur-raycast` 或 `backdrop-blur-raycast-lg`

#### 7. 动画库

使用 `motion/react`（原 framer-motion）进行动画：

```typescript
import { motion, AnimatePresence } from "motion/react"

// 列表项淡入动画
<motion.div
  initial={{ opacity: 0, y: 4 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
>

// 页面切换动画
<AnimatePresence mode="wait">
  <motion.div
    key="page-key"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
  >
</AnimatePresence>
```

**动画原则**：
- 列表项：淡入 + 轻微上移（y: 4）
- 页面切换：淡入淡出 + 轻微上移（y: 8）
- 持续时间：150-300ms
- 缓动函数：`cubic-bezier(0.4, 0, 0.2, 1)`

#### 8. 布局规范

**Flex 布局**：
- 使用 `flex flex-col` 进行垂直布局
- 使用 `flex-1` 让子元素占据剩余空间
- 避免在 `ResultsRender` 等已有内部布局的组件外包裹额外的 flex 容器

**滚动容器**：
- `ResultsRender` 组件内部已处理滚动，不要在外层添加 `overflow-hidden`
- 确保滚动容器有明确的高度约束（`flex-1` 或固定高度）

**Footer 固定**：
- Footer 应放在 flex 容器的最底部
- 使用 `flex-1 flex flex-col` 确保内容区域可滚动，Footer 固定在底部

#### 9. 交互反馈

**Hover 效果**：
- Card：`hover:shadow-raycast-hover` + 轻微缩放 `hover:scale-[1.01]`
- 按钮：`hover:shadow-raycast-hover` + `active:scale-[0.98]`
- 输入框：`hover:bg-[var(--gray4)]`

**Focus 状态**：
- 所有可交互元素必须有清晰的 focus 状态
- 使用 `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

**键盘导航**：
- 确保所有列表项支持键盘导航（上下键）
- 使用 `handleKeyEvent` prop 控制键盘事件处理

#### 10. 加载和空状态

**加载状态**：
- 使用 `Skeleton` 组件或加载动画
- 显示进度指示器（如进度条）

**空状态**：
- 添加图标和友好的提示文本
- 使用 `motion` 添加淡入动画
- 居中显示：`flex-1 flex items-center justify-center`

#### 11. 组件使用示例

```typescript
// Card 组件
<Card className="border-0 bg-[var(--gray3)] hover:shadow-raycast-hover">
  <CardContent className="p-3">
    {/* 内容 */}
  </CardContent>
</Card>

// Button 组件
<Button variant="outline" className="hover:shadow-raycast-hover">
  按钮文本
</Button>

// Input 组件
<Input className="bg-[var(--gray3)]" />

// Select 组件
<Select>
  <SelectTrigger className="bg-[var(--gray3)] hover:bg-[var(--gray4)]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent className="backdrop-blur-raycast">
    {/* 选项 */}
  </SelectContent>
</Select>
```

#### 12. 禁止事项

- ❌ 不要使用内联样式（`style={{}}`）
- ❌ 不要在 `ResultsRender` 外包裹额外的滚动容器
- ❌ 不要使用纯白色背景（使用 `bg-[var(--gray3)]` 等）
- ❌ 不要在 `src/command/` 目录下的组件中使用 shadcn/ui 组件
- ❌ 不要破坏 `ResultsRender` 的内部布局结构

## Window Management & Global Shortcuts

The application registers a global hotkey (`Alt+Space`) in `src/App.tsx`:

- Toggles window visibility when pressed and released
- When showing window: automatically centers, focuses, and makes visible
- When hiding window: simply hides without destroying
- Window configuration (`src-tauri/tauri.conf.json`):
    - Size: 900x540px
    - Decorations: disabled (custom frameless window)
    - Transparent background supported
    - Always on top, skips taskbar
    - Vite dev server: `http://localhost:1421`

### Control Server (HTTP API)

Rua includes a built-in HTTP control server that listens on `127.0.0.1:7777`:

- Started automatically when the application launches
- Provides API endpoints for external control
- Used by `ruactl` command-line utility

**Endpoints:**

- `POST /toggle` - Toggle window visibility
- `POST /health` - Check server status

### ruactl - Command-Line Control Utility

`ruactl` is a standalone binary that communicates with rua via HTTP:

**Installation:**

```bash
./install-ruactl.sh  # Installs to ~/.local/bin
```

**Usage:**

```bash
ruactl toggle   # Toggle window visibility
ruactl health   # Check if rua is running
ruactl help     # Show help message
```

**Hyprland Integration:**
You can bind `ruactl toggle` to a global hotkey in your Hyprland config:

```
bind = ALT, Space, exec, ruactl toggle
```

This approach works across all workspaces in Hyprland, avoiding the workspace-switching issues with Tauri's global
shortcuts.

## Tauri Asset Protocol

The application uses Tauri's asset protocol to access system icons:

- Enabled in `src-tauri/tauri.conf.json` under `security.assetProtocol`
- Scoped to: `$HOME/.local/share/**` and `/usr/share/**`
- Required permissions defined in `src-tauri/capabilities/default.json`
- Icons are converted using `convertFileSrc()` from `@tauri-apps/api/core`

## Workflow Requirements

1. **Clean up unused files**: Remove files that are no longer needed promptly
