# Rua

A modern, extensible command palette launcher for Linux.

![img.png](./.github/img.png)

## Features

- 🚀 Fast and lightweight command palette
- 🔌 Extensible plugin system with hot reload support
- 🎨 Beautiful UI with dark/light theme support
- ⌨️ Keyboard-first navigation
- 🔍 Fuzzy search for applications and actions
- 📦 Easy extension development with `create-rua-ext`

## Documentation

For detailed documentation, including:

- 📖 [Installation Guide](https://rua-docs.vercel.app/docs/getting-started/installation)
- 🔌 [Extension Development](https://rua-docs.vercel.app/docs/extensions/create-rua-ext)
- 📚 [API Reference](https://rua-docs.vercel.app/docs/api/overview)
- 🛠️ [ruactl CLI Tool](https://rua-docs.vercel.app/docs/user-guide/ruactl)
- 🤝 [Contributing Guide](https://rua-docs.vercel.app/docs/contributing/development-setup)

Visit the **[Rua Documentation](https://rua-docs.vercel.app)** website.

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

## Create an Extension

```bash
bunx create-rua-ext my-extension
cd my-extension
bun install
bun run build
```

See the [Extension Development Guide](https://rua-docs.vercel.app/docs/extensions/create-rua-ext) for more details.

## License

MIT


## TODO

1. [ ] main context 支持监听 search 框的输入
