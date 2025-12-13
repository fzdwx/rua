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
  template: 'basic' | 'view' | 'command';
  packageManager: 'npm' | 'bun' | 'pnpm' | 'yarn';
  buildTool: 'vite' | 'none';
  framework: 'none' | 'react' | 'vue' | 'svelte';
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

const STYLING_OPTIONS = [
  { title: 'None', value: 'none', description: 'No CSS framework' },
  { title: 'Tailwind CSS', value: 'tailwind', description: 'Utility-first CSS framework' },
  { title: 'shadcn/ui', value: 'shadcn', description: 'Tailwind + shadcn/ui components' },
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
  const hasUI = config.template !== 'command';
  const useVite = config.buildTool === 'vite';
  const pmRun = config.packageManager === 'npm' ? 'npm run' : config.packageManager;

  return {
    // Basic info
    name: config.name,
    id: config.id,
    description: config.description,
    author: config.author,
    kebabName,
    
    // Template flags
    isViewExtension: config.template === 'basic' || config.template === 'view',
    isCommandExtension: config.template === 'command',
    hasUI,
    
    // Build tool flags
    useVite,
    useVanilla: config.framework === 'none',
    useReact: config.framework === 'react',
    useVue: config.framework === 'vue',
    useSvelte: config.framework === 'svelte',
    hasPlugins: config.framework !== 'none',
    
    // Styling flags
    useTailwind: config.styling === 'tailwind' || config.styling === 'shadcn',
    useShadcn: config.styling === 'shadcn',
    useNoStyling: config.styling === 'none',
    
    // Package manager
    packageManager: config.packageManager,
    pmRun,
    
    // Permissions
    permissions: config.permissions,
    hasPermissions: config.permissions.length > 0,
    hasClipboard: config.permissions.includes('clipboard'),
    hasNotification: config.permissions.includes('notification'),
    hasStorage: config.permissions.includes('storage'),
    hasHttp: config.permissions.includes('http'),
    hasShell: config.permissions.includes('shell'),
    
    // File paths
    uiEntry: useVite ? 'dist/index.html' : 'index.html',
    initEntry: useVite ? 'dist/init.js' : 'init.js',
    commandScript: useVite ? 'dist/commands/run.js' : 'commands/run.js',
    scriptSrc: useVite ? '/src/main.ts' : 'main.js',
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
    
    // index.html
    const indexTemplate = path.join(templatesDir, 'index.html.template');
    const indexContent = renderTemplate(indexTemplate, context);
    fs.writeFileSync(path.join(targetDir, 'index.html'), indexContent);
    
    // src/main.ts
    const mainTemplate = path.join(templatesDir, 'src/main.ts.template');
    const mainContent = renderTemplate(mainTemplate, context);
    fs.writeFileSync(path.join(targetDir, 'src/main.ts'), mainContent);
    
    // src/style.css
    const styleTemplate = path.join(templatesDir, 'src/style.css.template');
    const styleContent = renderTemplate(styleTemplate, context);
    fs.writeFileSync(path.join(targetDir, 'src/style.css'), styleContent);
    
    // src/init.ts
    const initTemplate = path.join(templatesDir, 'src/init.ts.template');
    const initContent = renderTemplate(initTemplate, context);
    fs.writeFileSync(path.join(targetDir, 'src/init.ts'), initContent);

    // Framework-specific App component
    if (config.framework === 'react' && config.template !== 'command') {
      const appTemplateName = config.styling === 'shadcn' ? 'src/App-shadcn.tsx.template' : 'src/App.tsx.template';
      const appTemplate = path.join(templatesDir, appTemplateName);
      const appContent = renderTemplate(appTemplate, context);
      fs.writeFileSync(path.join(targetDir, 'src/App.tsx'), appContent);
    } else if (config.framework === 'vue' && config.template !== 'command') {
      const appTemplate = path.join(templatesDir, 'src/App.vue.template');
      const appContent = renderTemplate(appTemplate, context);
      fs.writeFileSync(path.join(targetDir, 'src/App.vue'), appContent);
    } else if (config.framework === 'svelte' && config.template !== 'command') {
      const appTemplate = path.join(templatesDir, 'src/App.svelte.template');
      const appContent = renderTemplate(appTemplate, context);
      fs.writeFileSync(path.join(targetDir, 'src/App.svelte'), appContent);
    }

    // Tailwind CSS setup
    if (config.styling === 'tailwind' || config.styling === 'shadcn') {
      const tailwindConfigTemplate = path.join(templatesDir, 'tailwind.config.ts.template');
      if (fs.existsSync(tailwindConfigTemplate)) {
        const tailwindConfigContent = renderTemplate(tailwindConfigTemplate, context);
        fs.writeFileSync(path.join(targetDir, 'tailwind.config.ts'), tailwindConfigContent);
      }

      const postcssConfigTemplate = path.join(templatesDir, 'postcss.config.ts.template');
      if (fs.existsSync(postcssConfigTemplate)) {
        const postcssConfigContent = renderTemplate(postcssConfigTemplate, context);
        fs.writeFileSync(path.join(targetDir, 'postcss.config.ts'), postcssConfigContent);
      }
    }

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
    
    if (config.template === 'command') {
      fs.mkdirSync(path.join(targetDir, 'commands'), { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'commands/run.js'), `export default function execute(api) {
  console.log('[${config.id}] Command executed!')
}
`);
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
      type: (_, values) => values.buildTool === 'vite' && values.template !== 'command' ? 'select' : null,
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
    packageManager: response.packageManager || 'npm',
    buildTool: response.buildTool || 'none',
    framework: response.framework || 'none',
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