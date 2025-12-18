# create-rua-ext

CLI tool to scaffold Rua extension projects with support for various build tools and UI frameworks.

## Features

- 🎯 **Template-based generation** - Each file is a separate template for easy maintenance
- 🚀 **Multiple frameworks** - React, Vue, Svelte, or vanilla JS
- ⚡ **Vite integration** - Fast development with HMR
- 🎨 **Styling options** - None, Tailwind CSS, or shadcn/ui
- 🔧 **Flexible permissions** - Choose only the APIs you need
- 📦 **Package manager choice** - npm, bun, pnpm, or yarn
- 🛠️ **Modern tooling** - TypeScript, ESM, and latest dependencies

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
8. **Styling** (when using Vite for UI extensions):
   - **None** - No CSS framework
   - **Tailwind CSS** - Utility-first CSS framework
   - **shadcn/ui** - Tailwind + shadcn/ui components
9. **Permissions**:
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

### Vite + React + shadcn/ui Template

```
my-extension/
├── manifest.json
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.ts
├── components.json
├── index.html
├── src/
│   ├── main.ts
│   ├── App.tsx
│   ├── init.ts
│   ├── style.css
│   └── lib/
│       └── utils.ts
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

All templates include `rua-api` for extension functionality. The API is initialized automatically:

```typescript
import { initializeRuaAPI } from "rua-api/browser";

// Initialize the API (extension info fetched from host)
const rua = await initializeRuaAPI();

// Use extension APIs
await rua.clipboard.writeText("Hello!");
await rua.notification.show({ title: "Hello!", body: "From extension" });
await rua.storage.set("key", "value");
await rua.ui.close();

// Register dynamic actions
await rua.actions.register([
  {
    id: "my-action",
    name: "My Action",
    mode: "view",
    keywords: ["hello"],
  },
]);
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
✔ Styling: › shadcn/ui
✔ Permissions: › storage, notification

Creating extension in /path/to/my-extension...

✓ Extension created successfully!

Next steps:
  cd my-extension
  bun install
  npx shadcn@latest add button card badge separator
  bun dev
```

## Template System

Templates are stored in `src/templates/` and use Handlebars for variable substitution:

- `manifest.json.template` - Extension manifest
- `package.json.template` - Package configuration
- `vite.config.ts.template` - Vite configuration
- `src/App.tsx.template` - React component template
- `src/App.vue.template` - Vue component template
- `src/App.svelte.template` - Svelte component template
- `src/init.ts.template` - Extension initialization
- `src/style.css.template` - Base styles
- `README.md.template` - Project documentation

Each template receives a context object with configuration flags and values.

## Development

```bash
# Install dependencies
bun install

# Build the CLI (includes copying templates)
bun run build

# Run in development
bun run dev

# Test template generation
node test-template.js
```
