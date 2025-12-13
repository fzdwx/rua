/**
 * Plugin Manifest Formatter
 * 
 * Formats plugin manifest for display purposes.
 * Based on Requirements 3.4
 */

import type { PluginManifest, ManifestAction } from '../types/manifest';

/**
 * Format options for manifest display
 */
export interface FormatOptions {
  /** Include actions list */
  includeActions?: boolean;
  /** Include permissions list */
  includePermissions?: boolean;
  /** Include dependencies */
  includeDependencies?: boolean;
  /** Use colors (for terminal output) */
  useColors?: boolean;
}

const defaultOptions: FormatOptions = {
  includeActions: true,
  includePermissions: true,
  includeDependencies: false,
  useColors: false,
};

/**
 * Format a single action for display
 */
function formatAction(action: ManifestAction, indent = '  '): string {
  const lines: string[] = [];
  lines.push(`${indent}• ${action.title} (${action.name})`);
  lines.push(`${indent}  Mode: ${action.mode}`);
  
  if (action.keywords && action.keywords.length > 0) {
    lines.push(`${indent}  Keywords: ${action.keywords.join(', ')}`);
  }
  
  if (action.subtitle) {
    lines.push(`${indent}  Subtitle: ${action.subtitle}`);
  }
  
  if (action.shortcut && action.shortcut.length > 0) {
    lines.push(`${indent}  Shortcut: ${action.shortcut.join('+')}`);
  }
  
  if (action.script) {
    lines.push(`${indent}  Script: ${action.script}`);
  }
  
  return lines.join('\n');
}

/**
 * Format a manifest for human-readable display
 * 
 * @param manifest - Plugin manifest
 * @param options - Format options
 * @returns Formatted string
 */
export function formatManifest(
  manifest: PluginManifest,
  options: FormatOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  const lines: string[] = [];

  // Header
  lines.push(`Plugin: ${manifest.name}`);
  lines.push(`ID: ${manifest.id}`);
  lines.push(`Version: ${manifest.version}`);

  // Optional metadata
  if (manifest.description) {
    lines.push(`Description: ${manifest.description}`);
  }

  if (manifest.author) {
    lines.push(`Author: ${manifest.author}`);
  }

  if (manifest.homepage) {
    lines.push(`Homepage: ${manifest.homepage}`);
  }

  if (manifest.repository) {
    lines.push(`Repository: ${manifest.repository}`);
  }

  // Rua config
  lines.push(`Engine Version: ${manifest.rua.engineVersion}`);

  if (manifest.rua.ui) {
    lines.push(`UI Entry: ${manifest.rua.ui.entry}`);
  }

  if (manifest.rua.init) {
    lines.push(`Init Script: ${manifest.rua.init}`);
  }

  // Permissions
  if (opts.includePermissions && manifest.permissions && manifest.permissions.length > 0) {
    lines.push('');
    lines.push('Permissions:');
    manifest.permissions.forEach(perm => {
      lines.push(`  • ${perm}`);
    });
  }

  // Actions
  if (opts.includeActions && manifest.rua.actions.length > 0) {
    lines.push('');
    lines.push(`Actions (${manifest.rua.actions.length}):`);
    manifest.rua.actions.forEach(action => {
      lines.push(formatAction(action));
    });
  }

  // Dependencies
  if (opts.includeDependencies && manifest.dependencies) {
    const deps = Object.entries(manifest.dependencies);
    if (deps.length > 0) {
      lines.push('');
      lines.push('Dependencies:');
      deps.forEach(([name, version]) => {
        lines.push(`  • ${name}: ${version}`);
      });
    }
  }

  return lines.join('\n');
}

/**
 * Format manifest as a compact single-line summary
 * 
 * @param manifest - Plugin manifest
 * @returns Compact summary string
 */
export function formatManifestCompact(manifest: PluginManifest): string {
  const actionCount = manifest.rua.actions.length;
  const permCount = manifest.permissions?.length ?? 0;
  
  return `${manifest.name} v${manifest.version} (${manifest.id}) - ${actionCount} action(s), ${permCount} permission(s)`;
}

/**
 * Format manifest for JSON display (pretty printed)
 * 
 * @param manifest - Plugin manifest
 * @returns Pretty-printed JSON string
 */
export function formatManifestJson(manifest: PluginManifest): string {
  return JSON.stringify(manifest, null, 2);
}
