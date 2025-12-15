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

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Rust](https://rustup.rs/) (for Tauri backend)
- [Just](https://github.com/casey/just) (command runner)

### Development

```bash
# Install dependencies
just pre

# Run in development mode
just dev

# Build for production
just build
```

## Documentation

For detailed documentation, including:

- 📖 [Installation Guide](https://fzdwx.github.io/rua/docs/getting-started/installation)
- 🔌 [Extension Development](https://fzdwx.github.io/rua/docs/extensions/create-rua-ext)
- 📚 [API Reference](https://fzdwx.github.io/rua/docs/api/overview)
- 🛠️ [ruactl CLI Tool](https://fzdwx.github.io/rua/docs/user-guide/ruactl)
- 🤝 [Contributing Guide](https://fzdwx.github.io/rua/docs/contributing/development-setup)

Visit the **[Rua Documentation](https://fzdwx.github.io/rua)** website.

## Create an Extension

```bash
bunx create-rua-ext my-extension
cd my-extension
bun install
bun run build
```

See the [Extension Development Guide](https://fzdwx.github.io/rua/docs/extensions/create-rua-ext) for more details.

## License

MIT
