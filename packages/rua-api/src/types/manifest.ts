/**
 * Extension Manifest Types
 */

/**
 * Simple permission string
 */
export type SimplePermission =
  | "clipboard" // Read/write clipboard
  | "notification" // Show system notifications
  | "storage" // Local storage access
  | "http" // HTTP requests
  | "shell" // Shell command execution (deprecated, use detailed config)
  | "fs:read" // Read files
  | "fs:read-dir" // Read directories
  | "fs:write" // Write files
  | "fs:exists" // Check file existence
  | "fs:stat"; // Get file metadata

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
 * Action mode determines how the action is executed and displayed.
 *
 * - `view`: Opens a custom UI view in the extension panel
 * - `background`: Runs automatically when rua starts, executing in the main program context.
 *   Background actions are used for initialization, registering dynamic actions, and
 *   responding to application lifecycle events. Each extension can have at most one
 *   background action.
 */
export type ActionMode =
  | "view" // Opens a custom UI view
  | "background"; // Runs automatically on startup in main context

/**
 * Action definition in manifest
 *
 * Each extension can define multiple actions in the manifest.
 * Actions with mode 'view' will load the UI entry with ?action={name} parameter.
 *
 * **Background Actions:**
 * - Actions with `mode: 'background'` run automatically when rua starts
 * - Background actions MUST have a `script` field pointing to the JavaScript file
 * - Each extension can have at most ONE background action
 * - Background scripts execute in the main program context (not in an iframe)
 * - Use background actions for initialization, registering dynamic actions, and
 *   responding to application lifecycle events (activate/deactivate)
 *
 * @example
 * ```json
 * {
 *   "name": "background-init",
 *   "title": "Background Initializer",
 *   "mode": "background",
 *   "script": "dist/background.js"
 * }
 * ```
 */
export interface ManifestAction {
  /** Action identifier (unique within extension) */
  name: string;
  /** Display title shown in command palette */
  title: string;
  /**
   * Action mode:
   * - 'view': Opens a custom UI view
   * - 'background': Runs automatically on startup (requires `script` field)
   */
  mode: ActionMode;
  /** Search keywords for this action */
  keywords?: string[];
  /** Icon path or iconify icon name */
  icon?: string;
  /** Subtitle shown below the title */
  subtitle?: string;
  /** Keyboard shortcut */
  shortcut?: string[];
  /**
   * Script to execute (relative path to JavaScript file).
   * Required for 'background' mode. This script runs automatically when rua starts.
   */
  script?: string;
  /** If true, shows a query input box when action is active in command palette */
  query?: boolean;
}

/**
 * Preference field types
 */
export type PreferenceType = "textfield" | "dropdown" | "toggle" | "shortcut" | "number" | "open" | "pathlist";

/**
 * Dropdown option
 */
export interface PreferenceOption {
  /** Option label shown in UI */
  label: string;
  /** Option value stored */
  value: string;
}

/**
 * Base preference field
 */
interface BasePreference {
  /** Unique preference identifier (within extension) */
  name: string;
  /** Display title */
  title: string;
  /** Description text shown below title */
  description?: string;
  /** Whether this preference is required */
  required?: boolean;
}

/**
 * Text input preference
 */
export interface TextfieldPreference extends BasePreference {
  type: "textfield";
  /** Default value */
  default?: string;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Dropdown/select preference
 */
export interface DropdownPreference extends BasePreference {
  type: "dropdown";
  /** Default value (must be one of options' value) */
  default?: string;
  /** Available options */
  options: PreferenceOption[];
}

/**
 * Toggle/switch preference
 */
export interface TogglePreference extends BasePreference {
  type: "toggle";
  /** Default value */
  default?: boolean;
}

/**
 * Shortcut/hotkey preference
 */
export interface ShortcutPreference extends BasePreference {
  type: "shortcut";
  /** Default shortcut value (e.g., "Ctrl+Shift+K") */
  default?: string;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Number input preference
 */
export interface NumberPreference extends BasePreference {
  type: "number";
  /** Default value */
  default?: number;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step increment value */
  step?: number;
}


/**
 * Open method preference
 */
export interface OpenPreference extends BasePreference {
  type: "open";
  /** Default value (false = use default open method) */
  default?: boolean;
  /** Comma-separated file paths */
  paths?: string[];
  /** Available open method options (exactly 2 options) */
  options: PreferenceOption[];
}

/**
 * Path list preference for managing directory arrays
 */
export interface PathListPreference extends BasePreference {
  type: "pathlist";
  /** Default value (array of directory paths) */
  default?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Enable path validation before adding */
  validatePaths?: boolean;
}

/**
 * Preference field definition
 */
export type PreferenceField =
  | TextfieldPreference
  | DropdownPreference
  | TogglePreference
  | ShortcutPreference
  | NumberPreference
  | OpenPreference
  | PathListPreference;

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

  /** Actions defined by this extension */
  actions: ManifestAction[];

  /** Preference fields */
  preferences?: PreferenceField[];
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
 *     "actions": [
 *       {
 *         "name": "background-init",
 *         "title": "Background Initializer",
 *         "mode": "background",
 *         "script": "dist/background.js"
 *       },
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
  /** Whether this is a built-in extension */
  builtin?: boolean;

  // Permissions
  /** Required permissions for extension functionality */
  permissions?: ExtensionPermission[];

  // Dependencies
  /** External package dependencies */
  dependencies?: Record<string, string>;
}
