#!/usr/bin/env node

/**
 * Generate API documentation from TypeScript source files
 * Uses TypeDoc to extract API information and generate MDX files
 */

const { Application, TSConfigReader, TypeDocReader } = require("typedoc");
const fs = require("fs").promises;
const path = require("path");

// Configuration
const CONFIG = {
  // TypeDoc configuration
  typedoc: {
    entryPoints: ["../../packages/rua-api/src/index.ts"],
    tsconfig: "../../packages/rua-api/tsconfig.json",
    excludeExternals: true,
    excludePrivate: true,
    excludeProtected: true,
    skipErrorChecking: true,
    plugin: ["typedoc-plugin-markdown"],
    readme: "none",
    out: "./generated-api-docs",
  },

  // Output configuration
  output: {
    dir: "./content/docs/api/generated",
    indexFile: "typescript-api.mdx",
  },
};

/**
 * Initialize TypeDoc application
 */
function createTypeDocApp() {
  const app = new Application();

  // Load TypeDoc configuration
  app.options.addReader(new TSConfigReader());
  app.options.addReader(new TypeDocReader());

  // Bootstrap with configuration
  app.bootstrap(CONFIG.typedoc);

  return app;
}

/**
 * Generate API documentation
 */
async function generateApiDocs() {
  console.log("🚀 Generating TypeScript API documentation...");

  try {
    // Create TypeDoc application
    const app = createTypeDocApp();

    // Convert TypeScript files
    const project = app.convert();

    if (!project) {
      throw new Error("Failed to convert TypeScript project");
    }

    // Generate documentation
    await app.generateDocs(project, CONFIG.typedoc.out);

    console.log("✅ TypeDoc generation completed");

    // Process generated files
    await processGeneratedDocs();

    console.log("✅ API documentation generated successfully");
  } catch (error) {
    console.error("❌ Failed to generate API documentation:", error);
    process.exit(1);
  }
}

/**
 * Process generated TypeDoc files and convert to Fumadocs format
 */
async function processGeneratedDocs() {
  const generatedDir = CONFIG.typedoc.out;
  const outputDir = CONFIG.output.dir;

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Read generated files
  const files = await fs.readdir(generatedDir);
  const markdownFiles = files.filter((file) => file.endsWith(".md"));

  console.log(`📝 Processing ${markdownFiles.length} generated files...`);

  // Process each markdown file
  for (const file of markdownFiles) {
    await processMarkdownFile(path.join(generatedDir, file), outputDir);
  }

  // Generate index file
  await generateIndexFile(outputDir, markdownFiles);
}

/**
 * Process individual markdown file
 */
async function processMarkdownFile(inputPath, outputDir) {
  const content = await fs.readFile(inputPath, "utf-8");
  const fileName = path.basename(inputPath, ".md");

  // Convert to MDX format with frontmatter
  const mdxContent = convertToMDX(content, fileName);

  // Write to output directory
  const outputPath = path.join(outputDir, `${fileName}.mdx`);
  await fs.writeFile(outputPath, mdxContent);

  console.log(`  ✓ Processed ${fileName}.mdx`);
}

/**
 * Convert markdown to MDX with Fumadocs frontmatter
 */
function convertToMDX(content, fileName) {
  // Extract title from content or use filename
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : formatTitle(fileName);

  // Generate frontmatter
  const frontmatter = `---
title: ${title}
description: Auto-generated TypeScript API documentation
icon: Code
generated: true
---

`;

  // Clean up content
  let cleanContent = content
    // Remove TypeDoc headers
    .replace(/^#{1,6}\s*\[.*?\]\(.*?\)$/gm, "")
    // Fix relative links
    .replace(/\]\(\.\/([^)]+)\)/g, "](/docs/api/generated/$1)")
    // Add code block language hints
    .replace(/```\n/g, "```typescript\n")
    // Clean up excessive newlines
    .replace(/\n{3,}/g, "\n\n");

  return frontmatter + cleanContent;
}

/**
 * Format filename to readable title
 */
function formatTitle(fileName) {
  return fileName
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/Api$/, "API");
}

/**
 * Generate index file for generated docs
 */
async function generateIndexFile(outputDir, files) {
  const indexContent = `---
title: TypeScript API Reference
description: Auto-generated API documentation from TypeScript source code
icon: FileCode
---

# TypeScript API Reference

This section contains auto-generated API documentation extracted from the TypeScript source code of the rua-api package.

<Callout type="info">
  This documentation is automatically generated from TypeScript source code. For more user-friendly guides, see the [API Overview](/docs/api/overview).
</Callout>

## Available APIs

${files
  .map((file) => {
    const name = path.basename(file, ".md");
    const title = formatTitle(name);
    return `- [${title}](/docs/api/generated/${name})`;
  })
  .join("\n")}

## Usage

All APIs are accessed through the main RuaAPI interface:

\`\`\`typescript
import { initializeRuaAPI } from 'rua-api/browser';

const rua = await initializeRuaAPI();
// Use any of the documented APIs
\`\`\`

## Type Definitions

The complete type definitions are available in the source code and through your IDE's IntelliSense when using the rua-api package.
`;

  const indexPath = path.join(outputDir, CONFIG.output.indexFile);
  await fs.writeFile(indexPath, indexContent);

  console.log("  ✓ Generated index file");
}

/**
 * Clean up generated files
 */
async function cleanup() {
  try {
    await fs.rm(CONFIG.typedoc.out, { recursive: true, force: true });
    console.log("🧹 Cleaned up temporary files");
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Main execution
if (require.main === module) {
  generateApiDocs()
    .then(() => cleanup())
    .catch(console.error);
}

module.exports = { generateApiDocs, cleanup };
