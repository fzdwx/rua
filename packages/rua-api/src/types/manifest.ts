/**
 * Extension Manifest Types
 */

/**
 * Simple permission string
 */
export type SimplePermission =
    | 'clipboard'      // Read/write clipboard
    | 'notification'   // Show system notifications
    | 'storage'        // Local storage access
    | 'http'           // HTTP requests
    | 'shell'          // Shell command execution (deprecated, use detailed config)
    | 'fs:read'        // Read files
    | 'fs:read-dir'    // Read directories
    | 'fs:write'       // Write files
    | 'fs:exists'      // Check file existence
    | 'fs:stat';       // Get file metadata

/**
 * Path-based permission rule
 */
export interface PathPermissionRule {
    /** Path pattern, supports $HOME, $APPDATA, ** wildcards */
    path: string;
}

/**
 * Shell command permission rule
 */
export interface ShellCommandRule {
    cmd: {
        /** Program name */
        program: string;
        /** Allowed arguments (regex patterns) */
        args?: string[];
    };
}

/**
 * Detailed permission with allow rules
 */
export interface DetailedPermission {
    /** Permission identifier */
    permission: string;
    /** Allowed paths or commands */
    allow?: (PathPermissionRule | ShellCommandRule)[];
}

/**
 * Available extension permissions
 * Can be a simple string or detailed configuration with allow rules
 */
export type ExtensionPermission = SimplePermission | DetailedPermission;

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
    /** If true, shows a query input box when action is active in command palette */
    query?: boolean;
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
