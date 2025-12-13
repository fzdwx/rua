#!/usr/bin/env node
/**
 * create-rua-ext CLI
 * 
 * A CLI tool to scaffold Rua extension projects.
 * 
 * Usage:
 *   bunx create-rua-ext
 *   bunx create-rua-ext my-extension
 */

import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import pc from 'picocolors';

interface ExtensionConfig {
  name: string;
  id: string;
  description: string;
  author: string;
  template: 'basic' | 'view' | 'command';
  packageManager: 'npm' | 'bun' | 'pnpm' | 'yarn';
  buildTool: 'vite' | 'none';
  framework: 'none' | 'react' | 'vue' | 'svelte';
  permissions: string[];
}

const TEMPLATES = {
  basic: {
    name: 'Basic (No Build)',
    description: 'Simple extension with vanilla JS/HTML',
  },
  view: {
    name: 'View Extension',
    description: 'Extension with UI framework and build tool',
  },
  command: {
    name: 'Command Extension',
    description: 'Command-only actions (no UI)',
  },
};

const PACKAGE_MANAGERS = [
  { title: 'npm', value: 'npm' },
  { title: 'bun', value: 'bun' },
  { title: 'pnpm', value: 'pnpm' },
  { title: 'yarn', value: 'yarn' },
];

const BUILD_TOOLS = [
  { title: 'Vite', value: 'vite', description: 'Fast build tool with HMR' },
  { title: 'None', value: 'none', description: 'No build tool (vanilla JS)' },
];

const FRAMEWORKS = [
  { title: 'None (Vanilla)', value: 'none', description: 'Plain HTML/JS' },
  { title: 'React', value: 'react', description: 'React with TypeScript' },
  { title: 'Vue', value: 'vue', description: 'Vue 3 with TypeScript' },
  { title: 'Svelte', value: 'svelte', description: 'Svelte with TypeScript' },
];

const PERMISSIONS = [
  { title: 'Clipboard', value: 'clipboard', description: 'Read/write clipboard' },
  { title: 'Notification', value: 'notification', description: 'Show system notifications' },
  { title: 'Storage', value: 'storage', description: 'Local storage access' },
  { title: 'HTTP', value: 'http', description: 'Make HTTP requests' },
  { title: 'Shell', value: 'shell', description: 'Execute shell commands' },
];


function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateManifest(config: ExtensionConfig): string {
  const hasUI = config.template !== 'command';
  const manifest: Record<string, unknown> = {
    id: config.id,
    name: config.name,
    version: '0.1.0',
    description: config.description,
    author: config.author,
    rua: {
      engineVersion: '^0.1.0',
      ui: hasUI ? { entry: config.buildTool === 'vite' ? 'dist/index.html' : 'index.html' } : undefined,
      init: config.buildTool === 'vite' ? 'dist/init.js' : 'init.js',
      actions: [] as Array<Record<string, unknown>>,
    },
    permissions: config.permissions.length > 0 ? config.permissions : undefined,
  };

  const actions = manifest.rua as { actions: Array<Record<string, unknown>> };
  
  if (config.template === 'basic' || config.template === 'view') {
    actions.actions.push({
      name: 'main',
      title: config.name,
      mode: 'view',
      keywords: [toKebabCase(config.name)],
      icon: 'tabler:star',
      subtitle: config.description,
    });
  }

  if (config.template === 'command') {
    actions.actions.push({
      name: 'run',
      title: `Run ${config.name}`,
      mode: 'command',
      keywords: ['run', 'execute'],
      icon: 'tabler:player-play',
      subtitle: 'Execute the command',
      script: config.buildTool === 'vite' ? 'dist/commands/run.js' : 'commands/run.js',
    });
  }

  if (!(manifest.rua as Record<string, unknown>).ui) {
    delete (manifest.rua as Record<string, unknown>).ui;
  }
  if (!manifest.permissions) {
    delete manifest.permissions;
  }

  return JSON.stringify(manifest, null, 2);
}

function generatePackageJson(config: ExtensionConfig): string {
  const pkg: Record<string, unknown> = {
    name: config.id,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {} as Record<string, string>,
    dependencies: {} as Record<string, string>,
    devDependencies: {} as Record<string, string>,
  };

  const scripts = pkg.scripts as Record<string, string>;
  const deps = pkg.dependencies as Record<string, string>;
  const devDeps = pkg.devDependencies as Record<string, string>;

  // Add rua-api
  deps['rua-api'] = '^0.1.0';

  if (config.buildTool === 'vite') {
    scripts.dev = 'vite';
    scripts.build = 'vite build';
    scripts.preview = 'vite preview';
    devDeps['vite'] = '^6.0.0';
    devDeps['typescript'] = '^5.8.0';

    if (config.framework === 'react') {
      deps['react'] = '^19.0.0';
      deps['react-dom'] = '^19.0.0';
      devDeps['@vitejs/plugin-react'] = '^4.0.0';
      devDeps['@types/react'] = '^19.0.0';
      devDeps['@types/react-dom'] = '^19.0.0';
    } else if (config.framework === 'vue') {
      deps['vue'] = '^3.5.0';
      devDeps['@vitejs/plugin-vue'] = '^5.0.0';
      devDeps['vue-tsc'] = '^2.0.0';
    } else if (config.framework === 'svelte') {
      deps['svelte'] = '^5.0.0';
      devDeps['@sveltejs/vite-plugin-svelte'] = '^4.0.0';
    }
  }

  return JSON.stringify(pkg, null, 2);
}

function generateViteConfig(config: ExtensionConfig): string {
  let plugins = '';
  let imports = '';

  if (config.framework === 'react') {
    imports = `import react from '@vitejs/plugin-react'`;
    plugins = 'react()';
  } else if (config.framework === 'vue') {
    imports = `import vue from '@vitejs/plugin-vue'`;
    plugins = 'vue()';
  } else if (config.framework === 'svelte') {
    imports = `import { svelte } from '@sveltejs/vite-plugin-svelte'`;
    plugins = 'svelte()';
  }

  return `import { defineConfig } from 'vite'
${imports}

export default defineConfig({
  ${plugins ? `plugins: [${plugins}],` : ''}
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        init: 'src/init.ts',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
`;
}

function generateTsConfig(config: ExtensionConfig): string {
  const compilerOptions: Record<string, unknown> = {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    noEmit: true,
  };

  if (config.framework === 'react') {
    compilerOptions.jsx = 'react-jsx';
  }

  return JSON.stringify({ compilerOptions, include: ['src'] }, null, 2);
}

function generateIndexHtml(config: ExtensionConfig): string {
  const scriptSrc = config.buildTool === 'vite' ? '/src/main.ts' : 'main.js';
  const scriptType = config.buildTool === 'vite' ? 'module' : 'text/javascript';
  
  let rootElement = '<div id="app"></div>';
  if (config.framework === 'react') {
    rootElement = '<div id="root"></div>';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
    }
    #app, #root { padding: 16px; }
  </style>
</head>
<body>
  ${rootElement}
  <script type="${scriptType}" src="${scriptSrc}"></script>
</body>
</html>`;
}


function generateMainTs(config: ExtensionConfig): string {
  if (config.framework === 'react') {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
  }

  if (config.framework === 'vue') {
    return `import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
`;
  }

  if (config.framework === 'svelte') {
    return `import App from './App.svelte'
import './style.css'

const app = new App({
  target: document.getElementById('app')!,
})

export default app
`;
  }

  // Vanilla
  return `import './style.css'

// Get the current action from URL params
const params = new URLSearchParams(window.location.search)
const action = params.get('action')

const app = document.getElementById('app')!
app.innerHTML = \`
  <h1>${config.name}</h1>
  <p>Current action: \${action || 'none'}</p>
\`
`;
}

function generateAppComponent(config: ExtensionConfig): string {
  if (config.framework === 'react') {
    return `import { usePluginContext } from 'rua-api'

function App() {
  const params = new URLSearchParams(window.location.search)
  const action = params.get('action')

  return (
    <div className="container">
      <h1>${config.name}</h1>
      <p>Current action: {action || 'none'}</p>
    </div>
  )
}

export default App
`;
  }

  if (config.framework === 'vue') {
    return `<script setup lang="ts">
const params = new URLSearchParams(window.location.search)
const action = params.get('action')
</script>

<template>
  <div class="container">
    <h1>${config.name}</h1>
    <p>Current action: {{ action || 'none' }}</p>
  </div>
</template>

<style scoped>
.container {
  padding: 16px;
}
</style>
`;
  }

  if (config.framework === 'svelte') {
    return `<script lang="ts">
  const params = new URLSearchParams(window.location.search)
  const action = params.get('action')
</script>

<div class="container">
  <h1>${config.name}</h1>
  <p>Current action: {action || 'none'}</p>
</div>

<style>
  .container {
    padding: 16px;
  }
</style>
`;
  }

  return '';
}

function generateStyleCss(): string {
  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
  background: transparent;
}

.container {
  padding: 16px;
}

h1 {
  font-size: 20px;
  margin-bottom: 8px;
}

p {
  color: #666;
  font-size: 14px;
}

@media (prefers-color-scheme: dark) {
  body { color: #fff; }
  p { color: #aaa; }
}
`;
}

function generateInitTs(config: ExtensionConfig): string {
  return `/**
 * ${config.name} - Initialization Script
 */
import type { PluginAPI } from 'rua-api'

export function activate(api: PluginAPI) {
  console.log(\`[\${api.pluginId}] Extension activated!\`)
  ${config.permissions.includes('storage') ? `
  api.storage.set('lastActivated', new Date().toISOString())
    .catch(err => console.error('Failed to store:', err))` : ''}
}

export function deactivate() {
  console.log('[${config.id}] Extension deactivated!')
}
`;
}

function generateReadme(config: ExtensionConfig): string {
  const pmRun = config.packageManager === 'npm' ? 'npm run' : config.packageManager;
  
  return `# ${config.name}

${config.description}

## Development

\`\`\`bash
# Install dependencies
${config.packageManager} install

${config.buildTool === 'vite' ? `# Start dev server
${pmRun} dev

# Build for production
${pmRun} build
` : '# No build step required'}
\`\`\`

## Installation

${config.buildTool === 'vite' 
  ? '1. Run \`' + pmRun + ' build\` to build the extension\n2. Copy the entire folder to your Rua extensions directory'
  : '1. Copy this folder to your Rua extensions directory'}
3. Enable the extension in the Extension Manager

## Permissions

${config.permissions.length > 0 
  ? config.permissions.map(p => `- \`${p}\``).join('\n')
  : 'No special permissions required.'}

## License

MIT
`;
}


async function createExtension(targetDir: string, config: ExtensionConfig) {
  fs.mkdirSync(targetDir, { recursive: true });

  // Write manifest.json
  fs.writeFileSync(path.join(targetDir, 'manifest.json'), generateManifest(config));

  if (config.buildTool === 'vite') {
    // Vite project structure
    fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
    
    fs.writeFileSync(path.join(targetDir, 'package.json'), generatePackageJson(config));
    fs.writeFileSync(path.join(targetDir, 'vite.config.ts'), generateViteConfig(config));
    fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), generateTsConfig(config));
    fs.writeFileSync(path.join(targetDir, 'index.html'), generateIndexHtml(config));
    fs.writeFileSync(path.join(targetDir, 'src/main.ts'), generateMainTs(config));
    fs.writeFileSync(path.join(targetDir, 'src/style.css'), generateStyleCss());
    fs.writeFileSync(path.join(targetDir, 'src/init.ts'), generateInitTs(config));

    if (config.framework === 'react') {
      fs.writeFileSync(path.join(targetDir, 'src/App.tsx'), generateAppComponent(config));
    } else if (config.framework === 'vue') {
      fs.writeFileSync(path.join(targetDir, 'src/App.vue'), generateAppComponent(config));
    } else if (config.framework === 'svelte') {
      fs.writeFileSync(path.join(targetDir, 'src/App.svelte'), generateAppComponent(config));
    }
  } else {
    // Basic project (no build)
    fs.writeFileSync(path.join(targetDir, 'index.html'), generateIndexHtml(config));
    fs.writeFileSync(path.join(targetDir, 'init.js'), generateInitTs(config).replace(/: PluginAPI/g, '').replace(/import.*\n/g, ''));
    
    if (config.template === 'command') {
      fs.mkdirSync(path.join(targetDir, 'commands'), { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'commands/run.js'), `export default function execute(api) {
  console.log('[${config.id}] Command executed!')
}
`);
    }
  }

  fs.writeFileSync(path.join(targetDir, 'README.md'), generateReadme(config));
  fs.writeFileSync(path.join(targetDir, '.gitignore'), 'node_modules\ndist\n.DS_Store\n');
}

async function main() {
  console.log();
  console.log(pc.bold(pc.cyan('🧩 Create Rua Extension')));
  console.log();

  let extName = process.argv[2];

  const response = await prompts([
    {
      type: extName ? null : 'text',
      name: 'name',
      message: 'Extension name:',
      initial: 'my-extension',
      validate: (value) => value.length > 0 || 'Extension name is required',
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
      initial: 'A Rua extension',
    },
    {
      type: 'text',
      name: 'author',
      message: 'Author:',
      initial: '',
    },
    {
      type: 'select',
      name: 'template',
      message: 'Template:',
      choices: Object.entries(TEMPLATES).map(([value, { name, description }]) => ({
        title: name,
        description,
        value,
      })),
      initial: 1,
    },
    {
      type: (prev) => prev !== 'basic' ? 'select' : null,
      name: 'buildTool',
      message: 'Build tool:',
      choices: BUILD_TOOLS,
      initial: 0,
    },
    {
      type: (_, values) => values.buildTool === 'vite' && values.template !== 'command' ? 'select' : null,
      name: 'framework',
      message: 'UI Framework:',
      choices: FRAMEWORKS,
      initial: 1,
    },
    {
      type: (_, values) => values.buildTool === 'vite' ? 'select' : null,
      name: 'packageManager',
      message: 'Package manager:',
      choices: PACKAGE_MANAGERS,
      initial: 0,
    },
    {
      type: 'multiselect',
      name: 'permissions',
      message: 'Permissions (space to select):',
      choices: PERMISSIONS,
      hint: '- Space to select. Return to submit',
    },
  ], {
    onCancel: () => {
      console.log(pc.red('Cancelled'));
      process.exit(1);
    },
  });

  extName = extName || response.name;
  const kebabName = toKebabCase(extName);
  const extId = response.author 
    ? `${toKebabCase(response.author)}.${kebabName}`
    : kebabName;

  const config: ExtensionConfig = {
    name: extName,
    id: extId,
    description: response.description,
    author: response.author,
    template: response.template || 'basic',
    packageManager: response.packageManager || 'npm',
    buildTool: response.buildTool || 'none',
    framework: response.framework || 'none',
    permissions: response.permissions || [],
  };

  const targetDir = path.resolve(process.cwd(), kebabName);

  if (fs.existsSync(targetDir)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `Directory ${pc.yellow(kebabName)} already exists. Overwrite?`,
      initial: false,
    });

    if (!overwrite) {
      console.log(pc.red('Cancelled'));
      process.exit(1);
    }

    fs.rmSync(targetDir, { recursive: true });
  }

  console.log();
  console.log(`Creating extension in ${pc.green(targetDir)}...`);

  await createExtension(targetDir, config);

  console.log();
  console.log(pc.green('✓ Extension created successfully!'));
  console.log();
  console.log('Next steps:');
  console.log(`  ${pc.cyan('cd')} ${kebabName}`);
  
  if (config.buildTool === 'vite') {
    const pmInstall = config.packageManager === 'npm' ? 'npm install' : `${config.packageManager} install`;
    const pmRun = config.packageManager === 'npm' ? 'npm run' : config.packageManager;
    console.log(`  ${pc.cyan(pmInstall)}`);
    console.log(`  ${pc.cyan(`${pmRun} dev`)}`);
  } else {
    console.log(`  ${pc.cyan('# Edit your extension files')}`);
  }
  console.log();
}

main().catch((err) => {
  console.error(pc.red('Error:'), err);
  process.exit(1);
});
