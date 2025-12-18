#!/usr/bin/env node
/**
 * create-rua-ext CLI
 *
 * A CLI tool to scaffold Rua extension projects.
 * View mode uses Vite + React + @rua/ui + Tailwind CSS.
 *
 * Usage:
 *   bunx create-rua-ext
 *   bunx create-rua-ext my-extension
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import pc from "picocolors";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExtensionConfig {
  name: string;
  id: string;
  description: string;
  author: string;
  template: "basic" | "view";
  extensionType: "background" | "view" | "both";
  packageManager: "npm" | "bun" | "pnpm" | "yarn";
  buildTool: "vite" | "none";
  framework: "react"; // View mode only supports React now
  permissions: string[];
}

const TEMPLATES = {
  basic: {
    name: "Basic (No Build)",
    description: "Simple extension with vanilla JS/HTML",
  },
  view: {
    name: "View Extension",
    description: "Vite + React + @rua/ui + shadcn/ui + Tailwind CSS",
  },
};

const EXTENSION_TYPES = [
  {
    title: "Both (Background + View)",
    value: "both",
    description: "Background script and UI view",
  },
  { title: "View Only", value: "view", description: "UI view without background script" },
  {
    title: "Background Only",
    value: "background",
    description: "Background script without UI view",
  },
];

const PACKAGE_MANAGERS = [
  { title: "pnpm", value: "pnpm" },
  { title: "bun", value: "bun" },
  { title: "yarn", value: "yarn" },
  { title: "npm", value: "npm" },
];

const PERMISSIONS = [
  { title: "Clipboard", value: "clipboard", description: "Read/write clipboard" },
  { title: "Notification", value: "notification", description: "Show system notifications" },
  { title: "Storage", value: "storage", description: "Local storage access" },
  { title: "HTTP", value: "http", description: "Make HTTP requests" },
  { title: "Shell", value: "shell", description: "Execute shell commands" },
  { title: "FS Read", value: "fs:read", description: "Read files from file system" },
  { title: "FS Read Dir", value: "fs:read-dir", description: "Read directory contents" },
  { title: "FS Write", value: "fs:write", description: "Write files to file system" },
  { title: "FS Exists", value: "fs:exists", description: "Check if file exists" },
  { title: "FS Stat", value: "fs:stat", description: "Get file metadata" },
];

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate permissions JSON string with detailed configs for shell and fs permissions
 */
function generatePermissionsJson(permissions: string[]): string {
  const result: (string | object)[] = [];

  for (const perm of permissions) {
    if (perm === "shell") {
      // Shell permission with example allow rules
      result.push({
        permission: "shell",
        allow: [
          {
            cmd: {
              program: "echo",
              args: [".+"],
            },
          },
        ],
      });
    } else if (perm.startsWith("fs:")) {
      // FS permissions with example allow rules
      result.push({
        permission: perm,
        allow: [
          {
            path: "$HOME/**",
          },
        ],
      });
    } else {
      // Simple permissions (clipboard, notification, storage, http)
      result.push(perm);
    }
  }

  // Format with proper indentation
  const lines = JSON.stringify(result, null, 4).split("\n");
  // Remove first '[' and last ']', adjust indentation
  return lines
    .slice(1, -1)
    .map((line) => line.slice(4))
    .join("\n    ");
}

function getTemplatesDir(): string {
  // In development, templates are in src/templates
  // In production, they should be in the same directory as the built JS
  const devTemplatesDir = path.join(__dirname, "../src/templates");
  const prodTemplatesDir = path.join(__dirname, "templates");

  if (fs.existsSync(devTemplatesDir)) {
    return devTemplatesDir;
  }
  return prodTemplatesDir;
}

function renderTemplate(templatePath: string, context: any): string {
  const templateContent = fs.readFileSync(templatePath, "utf-8");
  const template = Handlebars.compile(templateContent);
  return template(context);
}

function createTemplateContext(config: ExtensionConfig) {
  const kebabName = toKebabCase(config.name);
  const hasBackground = config.extensionType === "background" || config.extensionType === "both";
  const hasView = config.extensionType === "view" || config.extensionType === "both";
  const useVite = config.buildTool === "vite";
  const pmRun = config.packageManager === "npm" ? "npm run" : config.packageManager;

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
    useVanilla: false, // View mode only supports React now
    useReact: true, // View mode always uses React
    useVue: false, // Removed Vue support
    useSvelte: false, // Removed Svelte support
    hasPlugins: true, // Always has React plugin

    // Styling flags - View mode uses both rua-ui and shadcn with Tailwind
    useTailwind: hasView,
    useShadcn: hasView, // Always include shadcn for view mode
    useNoStyling: !hasView,

    // UI Library flags - View mode uses both rua-ui and shadcn
    useRuaUI: hasView,
    useNoUILibrary: false,

    // Package manager
    packageManager: config.packageManager,
    pmRun,
    pmInstall: config.packageManager === "npm" ? "npm install" : `${config.packageManager} install`,
    useBun: config.packageManager === "bun",
    useNpm: config.packageManager === "npm",
    usePnpm: config.packageManager === "pnpm",
    useYarn: config.packageManager === "yarn",

    // Permissions
    permissions: config.permissions,
    hasPermissions: config.permissions.length > 0,
    hasClipboard: config.permissions.includes("clipboard"),
    hasNotification: config.permissions.includes("notification"),
    hasStorage: config.permissions.includes("storage"),
    hasHttp: config.permissions.includes("http"),
    hasShell: config.permissions.includes("shell"),
    hasFsRead: config.permissions.includes("fs:read"),
    hasFsReadDir: config.permissions.includes("fs:read-dir"),
    hasFsWrite: config.permissions.includes("fs:write"),
    hasFsExists: config.permissions.includes("fs:exists"),
    hasFsStat: config.permissions.includes("fs:stat"),
    // Generate permissions JSON with detailed configs for shell and fs
    permissionsJson: generatePermissionsJson(config.permissions),

    // File paths
    uiEntry: useVite ? "dist/index.html" : "index.html",
    initEntry: useVite ? "dist/init.js" : "init.js",
    scriptSrc: useVite ? "/src/main.tsx" : "main.js",
    scriptType: useVite ? "module" : "text/javascript",
  };
}

async function createExtension(targetDir: string, config: ExtensionConfig) {
  const templatesDir = getTemplatesDir();
  const context = createTemplateContext(config);

  fs.mkdirSync(targetDir, { recursive: true });

  // Create manifest.json
  const manifestTemplate = path.join(templatesDir, "manifest.json.template");
  const manifestContent = renderTemplate(manifestTemplate, context);
  fs.writeFileSync(path.join(targetDir, "manifest.json"), manifestContent);

  // Create .gitignore
  const gitignoreTemplate = path.join(templatesDir, ".gitignore.template");
  const gitignoreContent = renderTemplate(gitignoreTemplate, context);
  fs.writeFileSync(path.join(targetDir, ".gitignore"), gitignoreContent);

  // Create README.md
  const readmeTemplate = path.join(templatesDir, "README.md.template");
  const readmeContent = renderTemplate(readmeTemplate, context);
  fs.writeFileSync(path.join(targetDir, "README.md"), readmeContent);

  if (config.buildTool === "vite") {
    // Vite project structure
    fs.mkdirSync(path.join(targetDir, "src"), { recursive: true });

    // package.json
    const packageTemplate = path.join(templatesDir, "package.json.template");
    const packageContent = renderTemplate(packageTemplate, context);
    fs.writeFileSync(path.join(targetDir, "package.json"), packageContent);

    // vite.config.ts
    const viteConfigTemplate = path.join(templatesDir, "vite.config.ts.template");
    const viteConfigContent = renderTemplate(viteConfigTemplate, context);
    fs.writeFileSync(path.join(targetDir, "vite.config.ts"), viteConfigContent);

    // tsconfig.json
    const tsconfigTemplate = path.join(templatesDir, "tsconfig.json.template");
    const tsconfigContent = renderTemplate(tsconfigTemplate, context);
    fs.writeFileSync(path.join(targetDir, "tsconfig.json"), tsconfigContent);

    // View files (index.html, main.tsx, style.css, App.tsx)
    // View mode always uses React + @rua/ui + shadcn/ui + Tailwind
    const hasView = config.extensionType === "view" || config.extensionType === "both";
    if (hasView) {
      // index.html
      const indexTemplate = path.join(templatesDir, "index.html.template");
      const indexContent = renderTemplate(indexTemplate, context);
      fs.writeFileSync(path.join(targetDir, "index.html"), indexContent);

      // src/main.tsx (always React)
      const mainTemplate = path.join(templatesDir, "src/main.ts.template");
      const mainContent = renderTemplate(mainTemplate, context);
      fs.writeFileSync(path.join(targetDir, "src/main.tsx"), mainContent);

      // App.tsx - use rua-ui template
      const appTemplate = path.join(templatesDir, "src/App-rua-ui.tsx.template");
      const appContent = renderTemplate(appTemplate, context);
      fs.writeFileSync(path.join(targetDir, "src/App.tsx"), appContent);

      // style.css - use rua-ui style template
      const ruaUiStyleTemplate = path.join(templatesDir, "src/style-rua-ui.css.template");
      if (fs.existsSync(ruaUiStyleTemplate)) {
        const styleContent = renderTemplate(ruaUiStyleTemplate, context);
        fs.writeFileSync(path.join(targetDir, "src/style.css"), styleContent);
      }

      // shadcn/ui setup - always included for view mode
      const componentsJsonTemplate = path.join(templatesDir, "components.json.template");
      if (fs.existsSync(componentsJsonTemplate)) {
        const componentsJsonContent = renderTemplate(componentsJsonTemplate, context);
        fs.writeFileSync(path.join(targetDir, "components.json"), componentsJsonContent);
      }

      // Create lib/utils.ts for shadcn
      fs.mkdirSync(path.join(targetDir, "src/lib"), { recursive: true });
      const utilsTemplate = path.join(templatesDir, "src/lib/utils.ts.template");
      if (fs.existsSync(utilsTemplate)) {
        const utilsContent = renderTemplate(utilsTemplate, context);
        fs.writeFileSync(path.join(targetDir, "src/lib/utils.ts"), utilsContent);
      }
    }

    // Background script (init.ts)
    const hasBackground = config.extensionType === "background" || config.extensionType === "both";
    if (hasBackground) {
      const initTemplate = path.join(templatesDir, "src/init.ts.template");
      const initContent = renderTemplate(initTemplate, context);
      fs.writeFileSync(path.join(targetDir, "src/init.ts"), initContent);
    }
  } else {
    // Basic project (no build)
    const indexTemplate = path.join(templatesDir, "index.html.template");
    const indexContent = renderTemplate(indexTemplate, context);
    fs.writeFileSync(path.join(targetDir, "index.html"), indexContent);

    // Simple init.js (no TypeScript)
    const initTemplate = path.join(templatesDir, "src/init.ts.template");
    let initContent = renderTemplate(initTemplate, context);
    // Convert TypeScript to JavaScript
    initContent = initContent
      .replace(/import.*from.*rua-api\/browser.*\n/g, "")
      .replace(/: RuaAPI/g, "")
      .replace(/async function init\(\)/g, "async function init()");
    fs.writeFileSync(path.join(targetDir, "init.js"), initContent);
  }

  // Create GitHub Action workflow for Vite projects
  if (config.buildTool === "vite") {
    fs.mkdirSync(path.join(targetDir, ".github/workflows"), { recursive: true });
    const workflowTemplate = path.join(templatesDir, ".github/workflows/release.yml.template");
    if (fs.existsSync(workflowTemplate)) {
      const workflowContent = renderTemplate(workflowTemplate, context);
      fs.writeFileSync(path.join(targetDir, ".github/workflows/release.yml"), workflowContent);
    }
  }
}

async function main() {
  console.log();
  console.log(pc.bold(pc.cyan("🧩 Create Rua Extension")));
  console.log();

  let extName = process.argv[2];

  const response = await prompts(
    [
      {
        type: extName ? null : "text",
        name: "name",
        message: "Extension name:",
        initial: "my-extension",
        validate: (value) => value.length > 0 || "Extension name is required",
      },
      {
        type: "text",
        name: "description",
        message: "Description:",
        initial: "A Rua extension",
      },
      {
        type: "text",
        name: "author",
        message: "Author:",
        initial: "",
      },
      {
        type: "select",
        name: "extensionType",
        message: "Extension type:",
        choices: EXTENSION_TYPES,
        initial: 0,
      },
      {
        type: "select",
        name: "template",
        message: "Template:",
        choices: Object.entries(TEMPLATES).map(([value, { name, description }]) => ({
          title: name,
          description,
          value,
        })),
        initial: 1,
      },
      {
        type: (prev) => (prev !== "basic" ? "select" : null),
        name: "packageManager",
        message: "Package manager:",
        choices: PACKAGE_MANAGERS,
        initial: 1,
      },
      {
        type: "multiselect",
        name: "permissions",
        message: "Permissions (space to select):",
        choices: PERMISSIONS,
        hint: "- Space to select. Return to submit",
      },
    ],
    {
      onCancel: () => {
        console.log(pc.red("Cancelled"));
        process.exit(1);
      },
    }
  );

  extName = extName || response.name;
  const kebabName = toKebabCase(extName);
  const extId = response.author ? `${toKebabCase(response.author)}.${kebabName}` : kebabName;

  const isViewTemplate = response.template === "view";

  const config: ExtensionConfig = {
    name: extName,
    id: extId,
    description: response.description,
    author: response.author,
    template: response.template || "basic",
    extensionType: response.extensionType || "both",
    packageManager: response.packageManager || "npm",
    buildTool: isViewTemplate ? "vite" : "none",
    framework: "react", // View mode always uses React
    permissions: response.permissions || [],
  };

  const targetDir = path.resolve(process.cwd(), kebabName);

  if (fs.existsSync(targetDir)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `Directory ${pc.yellow(kebabName)} already exists. Overwrite?`,
      initial: false,
    });

    if (!overwrite) {
      console.log(pc.red("Cancelled"));
      process.exit(1);
    }

    fs.rmSync(targetDir, { recursive: true });
  }

  console.log();
  console.log(`Creating extension in ${pc.green(targetDir)}...`);

  await createExtension(targetDir, config);

  console.log();
  console.log(pc.green("✓ Extension created successfully!"));
  console.log();
  console.log("Next steps:");
  console.log(`  ${pc.cyan("cd")} ${kebabName}`);

  if (config.buildTool === "vite") {
    const pmInstall =
      config.packageManager === "npm" ? "npm install" : `${config.packageManager} install`;
    const pmRun = config.packageManager === "npm" ? "npm run" : config.packageManager;
    console.log(`  ${pc.cyan(pmInstall)}`);
    console.log(`  ${pc.cyan(`npx shadcn@latest add button card badge separator`)}`);
    console.log(`  ${pc.cyan(`${pmRun} dev`)}`);
    console.log();
    console.log(pc.dim("  Stack: Vite + React + @rua/ui + shadcn/ui + Tailwind CSS"));
    console.log(pc.dim("  @rua/ui: List, Form, ActionPanel, Toast, Navigation"));
    console.log(pc.dim("  shadcn/ui: Button, Card, Badge, and more"));
  } else {
    console.log(`  ${pc.cyan("# Edit your extension files")}`);
  }
  console.log();
}

main().catch((err) => {
  console.error(pc.red("Error:"), err);
  process.exit(1);
});
