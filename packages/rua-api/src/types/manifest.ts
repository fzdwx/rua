/**
 * Plugin Manifest Types
 * 
 * Defines the structure of plugin manifest.json files.
 * Based on Requirements 3.1, 3.2
 * 
 * Design inspired by KunKun extensions: https://docs.kunkun.sh/extensions/
 */

/**
 * Available plugin permissions
 * Plugins must declare required permissions in their manifest
 */
export type PluginPermission =
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
 * Each plugin can define multiple actions in the manifest.
 * Actions with mode 'view' will load the UI entry with ?action={name} parameter.
 */
export interface ManifestAction {
  /** Action identifier (unique within plugin) */
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
 * Rua-specific plugin configuration
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
   * Initialization script executed when plugin loads
   * Can be used for background tasks, registering shortcuts, etc.
   */
  init?: string;
  
  /** Actions defined by this plugin */
  actions: ManifestAction[];
}

/**
 * Plugin manifest structure (manifest.json)
 * 
 * Required fields: id, name, version, rua
 * Optional fields provide additional metadata and configuration
 * 
 * @example
 * ```json
 * {
 *   "id": "author.my-plugin",
 *   "name": "My Plugin",
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
export interface PluginManifest {
  // Required fields
  /** Unique plugin identifier, format: author.plugin-name */
  id: string;
  /** Display name shown in UI */
  name: string;
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  
  /** Rua-specific configuration */
  rua: RuaConfig;

  // Optional metadata
  /** Plugin description */
  description?: string;
  /** Plugin author name or email */
  author?: string;
  /** Plugin homepage URL */
  homepage?: string;
  /** Plugin repository URL */
  repository?: string;
  /** Search keywords for the plugin */
  keywords?: string[];
  /** Plugin icon path or iconify icon name (e.g., "tabler:puzzle") */
  icon?: string;

  // Permissions
  /** Required permissions for plugin functionality */
  permissions?: PluginPermission[];

  // Dependencies
  /** External package dependencies */
  dependencies?: Record<string, string>;
}

/**
 * Required fields in a plugin manifest
 */
export const REQUIRED_MANIFEST_FIELDS: (keyof PluginManifest)[] = [
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
export const VALID_PERMISSIONS: PluginPermission[] = [
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
