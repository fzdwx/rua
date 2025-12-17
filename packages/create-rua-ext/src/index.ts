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
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import pc from 'picocolors';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExtensionConfig {
  name: string;
  id: string;
  description: string;
  author: string;
  template: 'basic' | 'view';
  extensionType: 'background' | 'view' | 'both';
  packageManager: 'npm' | 'bun' | 'pnpm' | 'yarn';
  buildTool: 'vite' | 'none';
  framework: 'none' | 'react' | 'vue' | 'svelte';
  uiLibrary: 'none' | 'rua-ui';
  styling: 'none' | 'tailwind' | 'shadcn';
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
};

const EXTENSION_TYPES = [
  { title: 'Both (Background + View)', value: 'both', description: 'Background script and UI view' },
  { title: 'View Only', value: 'view', description: 'UI view without background script' },
  { title: 'Background Only', value: 'background', description: 'Background script without UI view' },
];

const PACKAGE_MANAGERS = [
  { title: 'pnpm', value: 'pnpm' },
  { title: 'bun', value: 'bun' },
  { title: 'yarn', value: 'yarn' },
  { title: 'npm', value: 'npm' },
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

const STYLING_OPTIONS = [
  { title: 'None', value: 'none', description: 'No CSS framework' },
  { title: 'Tailwind CSS', value: 'tailwind', description: 'Utility-first CSS framework' },
  { title: 'shadcn/ui', value: 'shadcn', description: 'Tailwind + shadcn/ui components' },
];

const UI_LIBRARY_OPTIONS = [
  { title: 'None', value: 'none', description: 'No UI library' },
  { title: 'Rua UI', value: 'rua-ui', description: 'Pre-built components with search, forms, and navigation' },
];

const PERMISSIONS = [
  { title: 'Clipboard', value: 'clipboard', description: 'Read/write clipboard' },
  { title: 'Notification', value: 'notification', description: 'Show system notifications' },
  { title: 'Storage', value: 'storage', description: 'Local storage access' },
  { title: 'HTTP', value: 'http', description: 'Make HTTP requests' },
  { title: 'Shell', value: 'shell', description: 'Execute shell commands' },
  { title: 'FS Read', value: 'fs:read', description: 'Read files from file system' },
  { title: 'FS Read Dir', value: 'fs:read-dir', description: 'Read directory contents' },
  { title: 'FS Write', value: 'fs:write', description: 'Write files to file system' },
  { title: 'FS Exists', value: 'fs:exists', description: 'Check if file exists' },
  { title: 'FS Stat', value: 'fs:stat', description: 'Get file metadata' },
];

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate permissions JSON string with detailed configs for shell and fs permissions
 */
function generatePermissionsJson(permissions: string[]): string {
  const result: (string | object)[] = [];

  for (const perm of permissions) {
    if (perm === 'shell') {
      // Shell permission with example allow rules
      result.push({
        permission: 'shell',
        allow: [
          {
            cmd: {
              program: 'echo',
              args: ['.+']
            }
          }
        ]
      });
    } else if (perm.startsWith('fs:')) {
      // FS permissions with example allow rules
      result.push({
        permission: perm,
        allow: [
          {
            path: '$HOME/**'
          }
        ]
      });
    } else {
      // Simple permissions (clipboard, notification, storage, http)
      result.push(perm);
    }
  }

  // Format with proper indentation
  const lines = JSON.stringify(result, null, 4).split('\n');
  // Remove first '[' and last ']', adjust indentation
  return lines.slice(1, -1).map(line => line.slice(4)).join('\n    ');
}

function getTemplatesDir(): string {
  // In development, templates are in src/templates
  // In production, they should be in the same directory as the built JS
  const devTemplatesDir = path.join(__dirname, '../src/templates');
  const prodTemplatesDir = path.join(__dirname, 'templates');

  if (fs.existsSync(devTemplatesDir)) {
    return devTemplatesDir;
  }
  return prodTemplatesDir;
}

function renderTemplate(templatePath: string, context: any): string {
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);
  return template(context);
}

function createTemplateContext(config: ExtensionConfig) {
  const kebabName = toKebabCase(config.name);
  const hasBackground = config.extensionType === 'background' || config.extensionType === 'both';
  const hasView = config.extensionType === 'view' || config.extensionType === 'both';
  const useVite = config.buildTool === 'vite';
  const pmRun = config.packageManager === 'npm' ? 'npm run' : config.packageManager;

  return {
    // Basic info
    name: config.name,
    id: config.id,
    description: config.description,
    author: config.author,
    kebabName,

    // Extension type flags
    hasBackground,
    hasView,
    isViewExtension: hasView,
    hasUI: hasView,

    // Build tool flags
    useVite,
    useVanilla: config.framework === 'none',
    useReact: config.framework === 'react',
    useVue: config.framework === 'vue',
    useSvelte: config.framework === 'svelte',
    hasPlugins: config.framework !== 'none',

    // Styling flags
    useTailwind: (config.styling === 'tailwind' || config.styling === 'shadcn') && config.uiLibrary !== 'rua-ui',
    useShadcn: config.styling === 'shadcn' && config.uiLibrary !== 'rua-ui',
    useNoStyling: config.styling === 'none' || config.uiLibrary === 'rua-ui',

    // UI Library flags
    useRuaUI: config.uiLibrary === 'rua-ui',
    useNoUILibrary: config.uiLibrary === 'none',

    // Package manager
    packageManager: config.packageManager,
    pmRun,
    pmInstall: config.packageManager === 'npm' ? 'npm install' : `${config.packageManager} install`,
    useBun: config.packageManager === 'bun',
    useNpm: config.packageManager === 'npm',
    usePnpm: config.packageManager === 'pnpm',
    useYarn: config.packageManager === 'yarn',

    // Permissions
    permissions: config.permissions,
    hasPermissions: config.permissions.length > 0,
    hasClipboard: config.permissions.includes('clipboard'),
    hasNotification: config.permissions.includes('notification'),
    hasStorage: config.permissions.includes('storage'),
    hasHttp: config.permissions.includes('http'),
    hasShell: config.permissions.includes('shell'),
    hasFsRead: config.permissions.includes('fs:read'),
    hasFsReadDir: config.permissions.includes('fs:read-dir'),
    hasFsWrite: config.permissions.includes('fs:write'),
    hasFsExists: config.permissions.includes('fs:exists'),
    hasFsStat: config.permissions.includes('fs:stat'),
    // Generate permissions JSON with detailed configs for shell and fs
    permissionsJson: generatePermissionsJson(config.permissions),

    // File paths
    uiEntry: useVite ? 'dist/index.html' : 'index.html',
    initEntry: useVite ? 'dist/init.js' : 'init.js',
    scriptSrc: useVite ? (config.framework === 'react' ? '/src/main.tsx' : '/src/main.ts') : 'main.js',
    scriptType: useVite ? 'module' : 'text/javascript',
  };
}

async function createExtension(targetDir: string, config: ExtensionConfig) {
  const templatesDir = getTemplatesDir();
  const context = createTemplateContext(config);

  fs.mkdirSync(targetDir, { recursive: true });

  // Create manifest.json
  const manifestTemplate = path.join(templatesDir, 'manifest.json.template');
  const manifestContent = renderTemplate(manifestTemplate, context);
  fs.writeFileSync(path.join(targetDir, 'manifest.json'), manifestContent);

  // Create .gitignore
  const gitignoreTemplate = path.join(templatesDir, '.gitignore.template');
  const gitignoreContent = renderTemplate(gitignoreTemplate, context);
  fs.writeFileSync(path.join(targetDir, '.gitignore'), gitignoreContent);

  // Create README.md
  const readmeTemplate = path.join(templatesDir, 'README.md.template');
  const readmeContent = renderTemplate(readmeTemplate, context);
  fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent);

  if (config.buildTool === 'vite') {
    // Vite project structure
    fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

    // package.json
    const packageTemplate = path.join(templatesDir, 'package.json.template');
    const packageContent = renderTemplate(packageTemplate, context);
    fs.writeFileSync(path.join(targetDir, 'package.json'), packageContent);

    // vite.config.ts
    const viteConfigTemplate = path.join(templatesDir, 'vite.config.ts.template');
    const viteConfigContent = renderTemplate(viteConfigTemplate, context);
    fs.writeFileSync(path.join(targetDir, 'vite.config.ts'), viteConfigContent);

    // tsconfig.json
    const tsconfigTemplate = path.join(templatesDir, 'tsconfig.json.template');
    const tsconfigContent = renderTemplate(tsconfigTemplate, context);
    fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), tsconfigContent);

    // View files (index.html, main.ts, style.css, App component)
    const hasView = config.extensionType === 'view' || config.extensionType === 'both';
    if (hasView) {
      // index.html
      const indexTemplate = path.join(templatesDir, 'index.html.template');
      const indexContent = renderTemplate(indexTemplate, context);
      fs.writeFileSync(path.join(targetDir, 'index.html'), indexContent);

      // src/main.tsx for React, src/main.ts for others
      const mainTemplate = path.join(templatesDir, 'src/main.ts.template');
      const mainContent = renderTemplate(mainTemplate, context);
      const mainFileName = config.framework === 'react' ? 'src/main.tsx' : 'src/main.ts';
      fs.writeFileSync(path.join(targetDir, mainFileName), mainContent);

      // src/style.css (skip React, it handles CSS separately based on uiLibrary)
      if (config.framework !== 'react') {
        const styleTemplate = path.join(templatesDir, 'src/style.css.template');
        const styleContent = renderTemplate(styleTemplate, context);
        fs.writeFileSync(path.join(targetDir, 'src/style.css'), styleContent);
      }

      // Framework-specific App component
      if (config.framework === 'react') {
        let appTemplateName: string;

        if (config.uiLibrary === 'rua-ui') {
          appTemplateName = 'src/App-rua-ui.tsx.template';
        } else if (config.styling === 'shadcn') {
          appTemplateName = 'src/App-shadcn.tsx.template';
        } else {
          appTemplateName = 'src/App.tsx.template';
        }

        const appTemplate = path.join(templatesDir, appTemplateName);
        const appContent = renderTemplate(appTemplate, context);
        fs.writeFileSync(path.join(targetDir, 'src/App.tsx'), appContent);

        // Handle different CSS files based on UI library
        if (config.uiLibrary === 'rua-ui') {
          const ruaUiStyleTemplate = path.join(templatesDir, 'src/style-rua-ui.css.template');
          if (fs.existsSync(ruaUiStyleTemplate)) {
            const styleContent = renderTemplate(ruaUiStyleTemplate, context);
            fs.writeFileSync(path.join(targetDir, 'src/style.css'), styleContent);
          }
        } else {
          const styleTemplate = path.join(templatesDir, 'src/style.css.template');
          const styleContent = renderTemplate(styleTemplate, context);
          fs.writeFileSync(path.join(targetDir, 'src/style.css'), styleContent);
        }
      } else if (config.framework === 'vue') {
        const appTemplate = path.join(templatesDir, 'src/App.vue.template');
        const appContent = renderTemplate(appTemplate, context);
        fs.writeFileSync(path.join(targetDir, 'src/App.vue'), appContent);
      } else if (config.framework === 'svelte') {
        const appTemplate = path.join(templatesDir, 'src/App.svelte.template');
        const appContent = renderTemplate(appTemplate, context);
        fs.writeFileSync(path.join(targetDir, 'src/App.svelte'), appContent);
      }
    }

    // Background script (init.ts)
    const hasBackground = config.extensionType === 'background' || config.extensionType === 'both';
    if (hasBackground) {
      const initTemplate = path.join(templatesDir, 'src/init.ts.template');
      const initContent = renderTemplate(initTemplate, context);
      fs.writeFileSync(path.join(targetDir, 'src/init.ts'), initContent);
    }

    // Tailwind CSS v4 uses @tailwindcss/vite plugin, no config files needed
    // The CSS file just needs @import "tailwindcss"

    // shadcn/ui setup
    if (config.styling === 'shadcn') {
      const componentsJsonTemplate = path.join(templatesDir, 'components.json.template');
      if (fs.existsSync(componentsJsonTemplate)) {
        const componentsJsonContent = renderTemplate(componentsJsonTemplate, context);
        fs.writeFileSync(path.join(targetDir, 'components.json'), componentsJsonContent);
      }

      // Create lib/utils.ts for shadcn
      fs.mkdirSync(path.join(targetDir, 'src/lib'), { recursive: true });
      const utilsTemplate = path.join(templatesDir, 'src/lib/utils.ts.template');
      if (fs.existsSync(utilsTemplate)) {
        const utilsContent = renderTemplate(utilsTemplate, context);
        fs.writeFileSync(path.join(targetDir, 'src/lib/utils.ts'), utilsContent);
      }
    }
  } else {
    // Basic project (no build)
    const indexTemplate = path.join(templatesDir, 'index.html.template');
    const indexContent = renderTemplate(indexTemplate, context);
    fs.writeFileSync(path.join(targetDir, 'index.html'), indexContent);

    // Simple init.js (no TypeScript)
    const initTemplate = path.join(templatesDir, 'src/init.ts.template');
    let initContent = renderTemplate(initTemplate, context);
    // Convert TypeScript to JavaScript
    initContent = initContent
      .replace(/import.*from.*rua-api\/browser.*\n/g, '')
      .replace(/: RuaAPI/g, '')
      .replace(/async function init\(\)/g, 'async function init()');
    fs.writeFileSync(path.join(targetDir, 'init.js'), initContent);
  }

  // Create GitHub Action workflow for Vite projects
  if (config.buildTool === 'vite') {
    fs.mkdirSync(path.join(targetDir, '.github/workflows'), { recursive: true });
    const workflowTemplate = path.join(templatesDir, '.github/workflows/release.yml.template');
    if (fs.existsSync(workflowTemplate)) {
      const workflowContent = renderTemplate(workflowTemplate, context);
      fs.writeFileSync(path.join(targetDir, '.github/workflows/release.yml'), workflowContent);
    }
  }
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
      name: 'extensionType',
      message: 'Extension type:',
      choices: EXTENSION_TYPES,
      initial: 0,
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
      type: (_, values) => values.buildTool === 'vite' && values.extensionType !== 'background' ? 'select' : null,
      name: 'uiLibrary',
      message: 'UI Library:',
      choices: UI_LIBRARY_OPTIONS,
      initial: 1,
    },
    {
      type: (_, values) => values.buildTool === 'vite' && values.extensionType !== 'background' && values.uiLibrary !== 'rua-ui' ? 'select' : null,
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
      initial: 1,
    },
    {
      type: (_, values) => values.buildTool === 'vite' && values.extensionType !== 'background' && values.uiLibrary !== 'rua-ui' ? 'select' : null,
      name: 'styling',
      message: 'Styling:',
      choices: STYLING_OPTIONS,
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
    extensionType: response.extensionType || 'both',
    packageManager: response.packageManager || 'npm',
    buildTool: response.buildTool || 'none',
    framework: response.uiLibrary === 'rua-ui' ? 'react' : (response.framework || 'none'),
    uiLibrary: response.uiLibrary || 'none',
    styling: response.styling || 'none',
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

    if (config.styling === 'shadcn') {
      console.log(`  ${pc.cyan(`npx shadcn@latest add button card badge separator`)}`);
    }

    if (config.uiLibrary === 'rua-ui') {
      console.log();
      console.log(pc.dim('  Using @rua/ui components (List, Form, Navigation)'));
    }

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
