# RUA-UI LIBRARY KNOWLEDGE BASE

**Generated:** 2025-12-29
**Commit:** c6607b2

## OVERVIEW

Shared UI component library with command palette system for Rua extensions.

## STRUCTURE

```
packages/rua-ui/src/
├── simple/               # High-level API - useCommand, CommandPalette, useNavigation
├── command/              # Low-level command palette primitives
│   ├── action/           # ActionImpl, Command, HistoryImpl classes
│   ├── search/           # Fuzzy search + ranking + pinyin support
│   ├── Input.tsx         # Search input with keyboard handling
│   ├── ResultsRender.tsx # Virtualized list (React Virtual)
│   ├── GridRender.tsx    # Grid layout (configurable columns/gap)
│   ├── DetailsPanel.tsx  # Split view panel (list:details)
│   ├── Footer.tsx       # Navigation footer + actions + toast
│   └── toastStore.ts     # showToast/hideToast (Raycast-style dots)
├── components/ui/        # Shadcn/ui components (button, input, dropdown, etc.)
├── components/animate-ui/ # Radix-powered animated primitives
├── hooks/                # use-controlled-state, use-data-state
├── common/               # Container, Background, LeftButton tools
└── styles/               # command.css, base styles
```

## WHERE TO LOOK

| Task                  | Location                    | Notes                       |
| --------------------- | --------------------------- | --------------------------- |
| Build command palette | `simple/CommandPalette.tsx` | Pre-built, add actions prop |
| Add list item         | `command/RenderItem.tsx`    | Custom rendering            |
| Add grid item         | `command/GridItem.tsx`      | Custom grid item            |
| Add footer action     | `command/FooterUtils.tsx`   | Keyboard shortcut helpers   |
| Add search ranking    | `command/search/ranking/`   | History, affinity, temporal |
| Add form component    | `components/ui/`            | Shadcn/ui base components   |
| Add custom hook       | `hooks/`                    | State management hooks      |
| Modify styles         | `styles/command.css`        | Layout-specific CSS         |

## CONVENTIONS

**Component Patterns:**

- **simple/**: High-level API for extension authors (useCommand hook + CommandPalette component)
- **command/**: Low-level building blocks (compose custom palettes from Input/ResultsRender/Footer)
- **Two layouts**: list (default) or grid (configurable columns/gap/itemHeight)
- **Details panel**: Optional split view (detailsRatio: "1:1" | "1:2" | "1:3" | "2:3")
- **Navigation**: push/pop/replace/popToRoot via useNavigation hook
- **Toasts**: Raycast-style dots (success=green, failure=red, animated=spinner)
- **Virtual scrolling**: @tanstack/react-virtual for large lists
- **Icons**: string or React.ReactElement, resolve relative paths via `ext://` protocol

**Action Interface:**

- Actions have `id`, `name`, `perform`, optional `icon`/`subtitle`/`shortcut`/`keywords`
- Usage tracking: `usageCount`, `lastUsedTime`, `recentUsage`, `queryAffinity`
- Nested actions: `parent` property for drill-down
- Query actions: `query: true` for input creation mode
- Footer actions: `footerAction()` returns actions per main action
- Details panel: `details()` returns React component for right panel
