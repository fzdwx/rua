/**
 * Plugin Manifest Validator
 * 
 * Validates plugin manifest.json files against the schema.
 * Based on Requirements 1.2, 3.1, 3.2
 */

import type {
  ExtensionManifest,
  ExtensionPermission,
  ActionMode,
  ManifestAction,
} from '../types/manifest';

import {
  VALID_PERMISSIONS,
  VALID_ACTION_MODES,
} from '../types/manifest';

/**
 * Validation error with detailed information
 */
export class ManifestValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'ManifestValidationError';
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ManifestValidationError[];
  manifest?: ExtensionManifest;
}

/**
 * Validate a single action definition
 */
function validateAction(action: unknown, index: number): ManifestValidationError[] {
  const errors: ManifestValidationError[] = [];
  const prefix = `rua.actions[${index}]`;

  if (!action || typeof action !== 'object') {
    errors.push(new ManifestValidationError(
      `${prefix} must be an object`,
      prefix,
      action
    ));
    return errors;
  }

  const a = action as Record<string, unknown>;

  // Required: name
  if (!a.name || typeof a.name !== 'string') {
    errors.push(new ManifestValidationError(
      `${prefix}.name is required and must be a string`,
      `${prefix}.name`,
      a.name
    ));
  } else if (!/^[a-z0-9-]+$/.test(a.name)) {
    errors.push(new ManifestValidationError(
      `${prefix}.name must contain only lowercase letters, numbers, and hyphens`,
      `${prefix}.name`,
      a.name
    ));
  }

  // Required: title
  if (!a.title || typeof a.title !== 'string') {
    errors.push(new ManifestValidationError(
      `${prefix}.title is required and must be a string`,
      `${prefix}.title`,
      a.title
    ));
  }

  // Required: mode
  if (!a.mode || typeof a.mode !== 'string') {
    errors.push(new ManifestValidationError(
      `${prefix}.mode is required and must be a string`,
      `${prefix}.mode`,
      a.mode
    ));
  } else if (!VALID_ACTION_MODES.includes(a.mode as ActionMode)) {
    errors.push(new ManifestValidationError(
      `${prefix}.mode must be one of: ${VALID_ACTION_MODES.join(', ')}`,
      `${prefix}.mode`,
      a.mode
    ));
  }

  // Optional: keywords (must be array of strings)
  if (a.keywords !== undefined) {
    if (!Array.isArray(a.keywords)) {
      errors.push(new ManifestValidationError(
        `${prefix}.keywords must be an array`,
        `${prefix}.keywords`,
        a.keywords
      ));
    } else if (!a.keywords.every((k: unknown) => typeof k === 'string')) {
      errors.push(new ManifestValidationError(
        `${prefix}.keywords must contain only strings`,
        `${prefix}.keywords`,
        a.keywords
      ));
    }
  }

  // Optional: shortcut (must be array of strings)
  if (a.shortcut !== undefined) {
    if (!Array.isArray(a.shortcut)) {
      errors.push(new ManifestValidationError(
        `${prefix}.shortcut must be an array`,
        `${prefix}.shortcut`,
        a.shortcut
      ));
    } else if (!a.shortcut.every((k: unknown) => typeof k === 'string')) {
      errors.push(new ManifestValidationError(
        `${prefix}.shortcut must contain only strings`,
        `${prefix}.shortcut`,
        a.shortcut
      ));
    }
  }

  // command mode requires script
  if (a.mode === 'command' && !a.script) {
    errors.push(new ManifestValidationError(
      `${prefix}.script is required when mode is 'command'`,
      `${prefix}.script`,
      a.script
    ));
  }

  return errors;
}

/**
 * Validate rua config section
 */
function validateRuaConfig(rua: unknown): ManifestValidationError[] {
  const errors: ManifestValidationError[] = [];

  if (!rua || typeof rua !== 'object') {
    errors.push(new ManifestValidationError(
      'rua config is required and must be an object',
      'rua',
      rua
    ));
    return errors;
  }

  const r = rua as Record<string, unknown>;

  // Required: engineVersion
  if (!r.engineVersion || typeof r.engineVersion !== 'string') {
    errors.push(new ManifestValidationError(
      'rua.engineVersion is required and must be a string',
      'rua.engineVersion',
      r.engineVersion
    ));
  }

  // Required: actions
  if (!r.actions || !Array.isArray(r.actions)) {
    errors.push(new ManifestValidationError(
      'rua.actions is required and must be an array',
      'rua.actions',
      r.actions
    ));
  } else if (r.actions.length === 0) {
    errors.push(new ManifestValidationError(
      'rua.actions must contain at least one action',
      'rua.actions',
      r.actions
    ));
  } else {
    // Validate each action
    r.actions.forEach((action, index) => {
      errors.push(...validateAction(action, index));
    });

    // Check for duplicate action names
    const names = r.actions
      .filter((a): a is { name: string } => a && typeof a === 'object' && typeof (a as Record<string, unknown>).name === 'string')
      .map(a => a.name);
    const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
    if (duplicates.length > 0) {
      errors.push(new ManifestValidationError(
        `Duplicate action names found: ${[...new Set(duplicates)].join(', ')}`,
        'rua.actions',
        duplicates
      ));
    }
  }

  // Optional: ui
  if (r.ui !== undefined) {
    if (!r.ui || typeof r.ui !== 'object') {
      errors.push(new ManifestValidationError(
        'rua.ui must be an object',
        'rua.ui',
        r.ui
      ));
    } else {
      const ui = r.ui as Record<string, unknown>;
      if (!ui.entry || typeof ui.entry !== 'string') {
        errors.push(new ManifestValidationError(
          'rua.ui.entry is required and must be a string',
          'rua.ui.entry',
          ui.entry
        ));
      }
    }
  }

  // Check if view mode actions exist but no ui.entry
  if (r.actions && Array.isArray(r.actions)) {
    const hasViewAction = r.actions.some(
      (a): a is { mode: string } => a && typeof a === 'object' && (a as Record<string, unknown>).mode === 'view'
    );
    if (hasViewAction && (!r.ui || !(r.ui as Record<string, unknown>).entry)) {
      errors.push(new ManifestValidationError(
        'rua.ui.entry is required when actions with mode "view" exist',
        'rua.ui.entry',
        undefined
      ));
    }
  }

  // Optional: init (must be string)
  if (r.init !== undefined && typeof r.init !== 'string') {
    errors.push(new ManifestValidationError(
      'rua.init must be a string',
      'rua.init',
      r.init
    ));
  }

  return errors;
}

/**
 * Validate permissions array
 */
function validatePermissions(permissions: unknown): ManifestValidationError[] {
  const errors: ManifestValidationError[] = [];

  if (permissions === undefined) {
    return errors;
  }

  if (!Array.isArray(permissions)) {
    errors.push(new ManifestValidationError(
      'permissions must be an array',
      'permissions',
      permissions
    ));
    return errors;
  }

  permissions.forEach((perm, index) => {
    if (typeof perm !== 'string') {
      errors.push(new ManifestValidationError(
        `permissions[${index}] must be a string`,
        `permissions[${index}]`,
        perm
      ));
    } else if (!VALID_PERMISSIONS.includes(perm as ExtensionPermission)) {
      errors.push(new ManifestValidationError(
        `permissions[${index}] must be one of: ${VALID_PERMISSIONS.join(', ')}`,
        `permissions[${index}]`,
        perm
      ));
    }
  });

  return errors;
}

/**
 * Validate plugin ID format
 */
function validatePluginId(id: string): ManifestValidationError[] {
  const errors: ManifestValidationError[] = [];

  // Format: author.plugin-name or just plugin-name
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)?$/.test(id)) {
    errors.push(new ManifestValidationError(
      'id must be in format "author.plugin-name" or "plugin-name" (lowercase, numbers, hyphens only)',
      'id',
      id
    ));
  }

  return errors;
}

/**
 * Validate a manifest object
 * 
 * @param data - Raw manifest data (usually parsed from JSON)
 * @returns Validation result with errors and parsed manifest
 */
export function validateManifest(data: unknown): ValidationResult {
  const errors: ManifestValidationError[] = [];

  // Must be an object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      valid: false,
      errors: [new ManifestValidationError('Manifest must be an object', undefined, data)],
    };
  }

  const manifest = data as Record<string, unknown>;

  // Check required fields
  if (!manifest.id || typeof manifest.id !== 'string') {
    errors.push(new ManifestValidationError(
      'id is required and must be a string',
      'id',
      manifest.id
    ));
  } else {
    errors.push(...validatePluginId(manifest.id));
  }

  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push(new ManifestValidationError(
      'name is required and must be a string',
      'name',
      manifest.name
    ));
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push(new ManifestValidationError(
      'version is required and must be a string',
      'version',
      manifest.version
    ));
  }

  // Validate rua config
  errors.push(...validateRuaConfig(manifest.rua));

  // Validate permissions
  errors.push(...validatePermissions(manifest.permissions));

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    manifest: data as ExtensionManifest,
  };
}

/**
 * Parse and validate manifest from JSON string
 * 
 * @param json - JSON string
 * @returns Validation result
 */
export function parseManifest(json: string): ValidationResult {
  try {
    const data = JSON.parse(json);
    return validateManifest(data);
  } catch (e) {
    return {
      valid: false,
      errors: [new ManifestValidationError(
        `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`,
        undefined,
        json
      )],
    };
  }
}

// ===== FORMATTING UTILITIES =====

/**
 * Format options for manifest display
 */
export interface FormatOptions {
  includeActions?: boolean;
  includePermissions?: boolean;
  includeDependencies?: boolean;
  useColors?: boolean;
}

const defaultFormatOptions: FormatOptions = {
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
 */
export function formatManifest(
  manifest: ExtensionManifest,
  options: FormatOptions = {}
): string {
  const opts = { ...defaultFormatOptions, ...options };
  const lines: string[] = [];

  // Header
  lines.push(`Extension: ${manifest.name}`);
  lines.push(`ID: ${manifest.id}`);
  lines.push(`Version: ${manifest.version}`);

  // Optional metadata
  if (manifest.description) {
    lines.push(`Description: ${manifest.description}`);
  }

  if (manifest.author) {
    lines.push(`Author: ${manifest.author}`);
  }

  // Rua config
  lines.push(`Engine Version: ${manifest.rua.engineVersion}`);

  if (manifest.rua.ui) {
    lines.push(`UI Entry: ${manifest.rua.ui.entry}`);
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

  return lines.join('\n');
}

/**
 * Format manifest as a compact single-line summary
 */
export function formatManifestCompact(manifest: ExtensionManifest): string {
  const actionCount = manifest.rua.actions.length;
  const permCount = manifest.permissions?.length ?? 0;
  
  return `${manifest.name} v${manifest.version} (${manifest.id}) - ${actionCount} action(s), ${permCount} permission(s)`;
}

/**
 * Format manifest for JSON display (pretty printed)
 */
export function formatManifestJson(manifest: ExtensionManifest): string {
  return JSON.stringify(manifest, null, 2);
}
