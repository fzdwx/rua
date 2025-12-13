# Rua

A modern, extensible command palette launcher for Linux, built with Tauri + React + TypeScript.

![img.png](./.github/img.png)

## Features

- 🚀 Fast and lightweight command palette
- 🔌 Extensible plugin system with hot reload support
- 🎨 Beautiful UI with dark/light theme support
- ⌨️ Keyboard-first navigation
- 🔍 Fuzzy search for applications and actions
- 📦 Easy extension development with `create-rua-ext`

## Project Structure

```
rua/
├── apps/rua/           # Main Tauri application
├── packages/
│   ├── rua-api/        # Extension API package
│   └── create-rua-ext/ # CLI for creating extensions
├── examples/
│   └── hello-word/     # Example extension
└── docs/               # Documentation
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Rust](https://rustup.rs/) (for Tauri backend)
- [Just](https://github.com/casey/just) (command runner)

### Development

```bash
# Install dependencies
bun install

# Run in development mode
just dev

# Build for production
just build
```

### Linux Dependencies

For clipboard functionality on Linux, install xclip:

```bash
# Arch Linux
sudo pacman -S xclip

# Ubuntu/Debian
sudo apt install xclip

# Fedora
sudo dnf install xclip
```

### Environment Variables

If you encounter rendering issues on Linux:

```bash
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export WEBKIT_DISABLE_COMPOSITING_MODE=1
```

## Extension Development

### Create a New Extension

```bash
bunx create-rua-ext my-extension
cd my-extension
bun install
bun run build
```

### Extension Manifest

Extensions are configured via `manifest.json`:

```json
{
  "id": "author.my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "rua": {
    "engineVersion": "^0.1.0",
    "ui": {
      "entry": "dist/index.html"
    },
    "actions": [
      {
        "name": "main",
        "title": "My Action",
        "mode": "view",
        "keywords": ["my", "action"],
        "icon": "tabler:star",
        "query": true
      }
    ]
  },
  "permissions": ["clipboard", "notification", "storage"]
}
```

### Extension API

Extensions can use the `rua-api` package to interact with the host:

```typescript
import { initializeRuaAPI } from 'rua-api/browser'

const rua = await initializeRuaAPI()

// Clipboard
const text = await rua.clipboard.readText()
await rua.clipboard.writeText('Hello!')

// Storage
await rua.storage.set('key', { data: 'value' })
const data = await rua.storage.get('key')

// Notifications
await rua.notification.show({ title: 'Hello', body: 'World' })

// UI Control
await rua.ui.hideInput()
await rua.ui.showInput()
await rua.ui.setTitle('New Title')
await rua.ui.close()

// Listen for search input changes
rua.on('search-change', (query) => {
  console.log('Search changed:', query)
})
```

### Action Query Support

Set `"query": true` in your action to enable the query input box. Users can type a query before entering your extension:

```json
{
  "name": "search",
  "title": "Search Something",
  "mode": "view",
  "query": true
}
```

Then listen for the initial query in your extension:

```typescript
rua.on('search-change', (query) => {
  // Handle the search query
  performSearch(query as string)
})
```

## Available Commands

```bash
just dev              # Run in development mode
just build            # Build the application
just install          # Install to /usr/bin/
just build-api        # Build rua-api package
just rebuild-example  # Rebuild rua-api and hello-word example
just publish-api      # Publish rua-api to npm
just publish-all      # Publish all packages
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT
