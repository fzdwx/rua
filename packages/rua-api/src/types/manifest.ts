/**
 * Extension Manifest Types
 * 
 * Defines the structure of extension manifest.json files.
 * Based on Requirements 3.1, 3.2
 * 
 * Design inspired by KunKun extensions: https://docs.kunkun.sh/extensions/
 */

/**
 * Available extension permissions
 * Extensions must declare required permissions in their manifest
 */
export type ExtensionPermission =
  | 'clipboard'      // Read/write clipboard
  | 'notification'   // Show system notifications
  | 'storage'        // Local storage access
  | 'http'           // HTTP requests
  | 'shell';         // Shell command execution

/**
 * Action mode determines how the action is displayed
 */
export type ActionMode = 
  | 'view'           // Opens a custom UI view
  | 'command';       // Executes a command without UI

/**
 * Action definition in manifest
 * 
 * Each extension can define multiple actions in the manifest.
 * Actions with mode 'view' will load the UI entry with ?action={name} parameter.
 */
export interface ManifestAction {
  /** Action identifier (unique within extension) */
  name: string;
  /** Display title shown in command palette */
  title: string;
  /** Action mode: 'view' for UI, 'command' for script execution */
  mode: ActionMode;
  /** Search keywords for this action */
  keywords?: string[];
  /** Icon path or iconify icon name */
  icon?: string;
  /** Subtitle shown below the title */
  subtitle?: string;
  /** Keyboard shortcut */
  shortcut?: string[];
  /** Script to execute for 'command' mode (relative path) */
  script?: string;
}

/**
 * Rua-specific extension configuration
 */
export interface RuaConfig {
  /** Minimum required Rua engine version */
  engineVersion: string;
  
  /** UI configuration */
  ui?: {
    /** HTML entry file for view mode actions */
    entry: string;
    /** Window width (optional) */
    width?: number;
    /** Window height (optional) */
    height?: number;
  };
  
  /** 
   * Initialization script executed when extension loads
   * Can be used for background tasks, registering shortcuts, etc.
   */
  init?: string;
  
  /** Actions defined by this extension */
  actions: ManifestAction[];
}

/**
 * Extension manifest structure (manifest.json)
 * 
 * Required fields: id, name, version, rua
 * Optional fields provide additional metadata and configuration
 * 
 * @example
 * ```json
 * {
 *   "id": "author.my-extension",
 *   "name": "My Extension",
 *   "version": "1.0.0",
 *   "rua": {
 *     "engineVersion": "^0.1.0",
 *     "ui": {
 *       "entry": "index.html"
 *     },
 *     "init": "init.js",
 *     "actions": [
 *       {
 *         "name": "open-baidu",
 *         "title": "打开百度",
 *         "mode": "view",
 *         "keywords": ["search", "baidu"]
 *       },
 *       {
 *         "name": "play-music",
 *         "title": "播放音乐",
 *         "mode": "view"
 *       }
 *     ]
 *   }
 * }
 * ```
 */
export interface ExtensionManifest {
  // Required fields
  /** Unique extension identifier, format: author.extension-name */
  id: string;
  /** Display name shown in UI */
  name: string;
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  
  /** Rua-specific configuration */
  rua: RuaConfig;

  // Optional metadata
  /** Extension description */
  description?: string;
  /** Extension author name or email */
  author?: string;
  /** Extension homepage URL */
  homepage?: string;
  /** Extension repository URL */
  repository?: string;
  /** Search keywords for the extension */
  keywords?: string[];
  /** Extension icon path or iconify icon name (e.g., "tabler:puzzle") */
  icon?: string;

  // Permissions
  /** Required permissions for extension functionality */
  permissions?: ExtensionPermission[];

  // Dependencies
  /** External package dependencies */
  dependencies?: Record<string, string>;
}

/**
 * Required fields in an extension manifest
 */
export const REQUIRED_MANIFEST_FIELDS: (keyof ExtensionManifest)[] = [
  'id',
  'name', 
  'version',
  'rua'
];

/**
 * Required fields in rua config
 */
export const REQUIRED_RUA_FIELDS: (keyof RuaConfig)[] = [
  'engineVersion',
  'actions'
];

/**
 * All valid permission values
 */
export const VALID_PERMISSIONS: ExtensionPermission[] = [
  'clipboard',
  'notification',
  'storage',
  'http',
  'shell'
];

/**
 * All valid action modes
 */
export const VALID_ACTION_MODES: ActionMode[] = [
  'view',
  'command'
];
