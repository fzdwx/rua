# create-rua-ext

CLI tool to scaffold Rua extension projects with support for various build tools and UI frameworks.

## Usage

```bash
# With bun
bunx create-rua-ext

# With npm/npx
npx create-rua-ext

# With extension name
bunx create-rua-ext my-awesome-extension
```

## Interactive Prompts

The CLI will ask you for:

1. **Extension name** - Display name for your extension
2. **Description** - Short description
3. **Author** - Your name (used in extension ID)
4. **Template**:
   - **Basic (No Build)** - Simple vanilla JS/HTML extension
   - **View Extension** - Extension with UI framework and build tool
   - **Command Extension** - Command-only actions (no UI)
5. **Build Tool** (for View/Command templates):
   - **Vite** - Fast build tool with HMR
   - **None** - No build tool (vanilla JS)
6. **UI Framework** (when using Vite):
   - **None (Vanilla)** - Plain HTML/JS
   - **React** - React with TypeScript
   - **Vue** - Vue 3 with TypeScript
   - **Svelte** - Svelte with TypeScript
7. **Package Manager** (when using Vite):
   - npm / bun / pnpm / yarn
8. **Permissions**:
   - `clipboard` - Read/write clipboard
   - `notification` - Show system notifications
   - `storage` - Local storage access
   - `http` - Make HTTP requests
   - `shell` - Execute shell commands

## Generated Structure

### Basic Template (No Build)

```
my-extension/
├── manifest.json
├── index.html
├── init.js
└── README.md
```

### Vite + React Template

```
my-extension/
├── manifest.json
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.ts
│   ├── App.tsx
│   ├── init.ts
│   └── style.css
└── README.md
```

### Command Template

```
my-extension/
├── manifest.json
├── package.json
├── src/
│   └── init.ts
├── commands/
│   └── run.js
└── README.md
```

## Using rua-api

When using Vite templates, `rua-api` is automatically added as a dependency. You can import types and utilities:

```typescript
import type { PluginAPI, PluginManifest } from 'rua-api'
import { usePluginContext, usePluginAPI } from 'rua-api'

export function activate(api: PluginAPI) {
  // Use the extension API
  api.storage.set('key', 'value')
  api.notification.show({ title: 'Hello!' })
}
```

## Example

```bash
$ bunx create-rua-ext

🧩 Create Rua Extension

✔ Extension name: … My Extension
✔ Description: … A cool extension for Rua
✔ Author: … john
✔ Template: › View Extension
✔ Build tool: › Vite
✔ UI Framework: › React
✔ Package manager: › bun
✔ Permissions: › storage, notification

Creating extension in /path/to/my-extension...

✓ Extension created successfully!

Next steps:
  cd my-extension
  bun install
  bun dev
```

## Development

```bash
# Build the CLI
bun run build

# Run in development
bun run dev
```
