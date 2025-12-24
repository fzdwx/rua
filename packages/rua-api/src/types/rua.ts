/**
 * Rua Extension API Types
 *
 * Shared types between the host application and extension iframes.
 * These types define the contract for Rua-specific APIs.
 */

import { CommonRuaAPI } from "../browser";

/** Current action information from manifest */
export interface CurrentActionInfo {
  /** Action name from manifest */
  name: string;
  /** Display title from manifest */
  title: string;
  /** Icon path or iconify icon name */
  icon?: string;
  /** Subtitle from manifest */
  subtitle?: string;
}

/** Extension metadata */
export interface ExtensionMeta {
  id: string;
  name: string;
  version: string;
  /** Extension directory path (for resolving relative asset paths) */
  path?: string;
  /** Current action info from manifest (populated when running in view mode) */
  currentAction?: CurrentActionInfo;
}

/** Dynamic action definition */
export interface DynamicAction {
  id: string;
  name: string;
  keywords?: string[];
  /**
   * Icon for the action. Supports multiple formats:
   * - Iconify icon name (e.g., "tabler:puzzle", "mdi:home")
   * - Data URI (e.g., "data:image/svg+xml;base64,...")
   * - SVG string (e.g., "<svg>...</svg>")
   * - Extension asset path (e.g., "./icon.png", "./assets/icon.svg")
   */
  icon?: string;
  subtitle?: string;
  mode: "view" | "command";
  section?: string;
  badge?: string; // Badge text to display on the right side of the action
}

/**
 * Action created from manifest definition
 * Used when loading actions from extension manifest
 */
export interface ManifestDerivedAction {
  /** Full namespaced ID (extension-id.action-name) */
  id: string;
  /** Display title */
  name: string;
  /** Action mode */
  mode: "view";
  /** Search keywords */
  keywords?: string;
  /**
   * Icon for the action. Supports multiple formats:
   * - Iconify icon name (e.g., "tabler:puzzle", "mdi:home")
   * - Data URI (e.g., "data:image/svg+xml;base64,...")
   * - SVG string (e.g., "<svg>...</svg>")
   * - Extension asset path (e.g., "./icon.png", "./assets/icon.svg")
   */
  icon?: string;
  /** Subtitle */
  subtitle?: string;
  /** Keyboard shortcut */
  shortcut?: string[];
  /** Extension ID */
  extensionId: string;
  /** Original action name from manifest */
  actionName: string;
  /** UI entry URL (for view mode) */
  uiEntry?: string;
  /** If true, shows a query input box when action is active */
  query?: boolean;
}

/** Event handler type
 * @ActionTriggeredData
 * */
export type EventHandler = (data: unknown) => void;

/** Action triggered event data */
export interface ActionTriggeredData {
  actionId: string;
  context?: unknown;
}

/** Search change event data */
export interface SearchChangeData {
  query: string;
}

/** Shell command execution result */
export interface ShellResult {
  /** Whether the command succeeded */
  success: boolean;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Exit code (null if process was killed) */
  exitCode: number | null;
}

/** File stat information */
export interface FileStat {
  /** File size in bytes */
  size: number;
  /** Whether it's a file */
  isFile: boolean;
  /** Whether it's a directory */
  isDirectory: boolean;
  /** Last modified time (Unix timestamp in ms) */
  mtime: number;
  /** Creation time (Unix timestamp in ms) */
  ctime: number;
}

/** Directory entry */
export interface DirEntry {
  /** Entry name */
  name: string;
  /** Whether it's a file */
  isFile: boolean;
  /** Whether it's a directory */
  isDirectory: boolean;
}

/** Base directory for file system operations */
export enum BaseDirectory {
  /** User's home directory (~) */
  Home = "home",
  /** Application data directory */
  AppData = "appData",
  /** Application local data directory */
  AppLocalData = "appLocalData",
  /** Application config directory */
  AppConfig = "appConfig",
  /** Desktop directory */
  Desktop = "desktop",
  /** Documents directory */
  Document = "document",
  /** Downloads directory */
  Download = "download",
  /** Pictures directory */
  Picture = "picture",
  /** Videos directory */
  Video = "video",
  /** Music directory */
  Audio = "audio",
  /** Temporary directory */
  Temp = "temp",
}

/** Options for file system operations */
export interface FsOptions {
  /** Base directory to resolve relative paths from */
  baseDir?: BaseDirectory;
}

/**
 * Rua API interface (client-side)
 * This is what extensions use via window.rua
 */
export interface RuaClientAPI extends CommonRuaAPI {
  ui: {
    /** close action back to main view */
    close(): Promise<void>;
    setTitle(title: string): Promise<void>;
    /** Get current theme */
    getTheme(): Promise<"light" | "dark">;
    /** Get initial search value passed from main app */
    getInitialSearch(): Promise<string>;
  };

  /** Preferences API for storing user preferences */
  preferences: {
    /** Get a preference value */
    get<T = unknown>(key: string): Promise<T | null>;
    /** Get all preferences for this extension */
    getAll(): Promise<Record<string, unknown>>;
    /** Set a preference value */
    set(key: string, value: unknown): Promise<void>;
    /** Set multiple preferences at once */
    setAll(values: Record<string, unknown>): Promise<void>;
    /** Remove a preference value */
    remove(key: string): Promise<void>;
  };

  /** Register event handler. View mode extensions support: activate, deactivate, action-triggered, theme-change */
  on(
    event: "activate" | "deactivate" | "action-triggered" | "theme-change",
    handler: EventHandler
  ): void;

  /** Unregister event handler */
  off(
    event: "activate" | "deactivate" | "action-triggered" | "theme-change",
    handler: EventHandler
  ): void;
}

/**
 * Rua API methods (server-side / host)
 * These are the raw RPC methods exposed to extensions
 */
export interface RuaServerAPI {
  // Extension info
  getExtensionInfo(): Promise<ExtensionMeta>;

  // Clipboard API
  clipboardReadText(): Promise<string>;

  clipboardWriteText(text: string): Promise<void>;

  // Notification API
  notificationShow(options: { title: string; body?: string }): Promise<void>;

  // Storage API
  storageGet(key: string): Promise<string | null>;

  storageSet(key: string, value: string): Promise<void>;

  storageRemove(key: string): Promise<void>;

  // Preferences API
  preferencesGet(key: string): Promise<string | null>;

  preferencesGetAll(): Promise<Record<string, string>>;

  preferencesSet(key: string, value: string): Promise<void>;

  preferencesSetAll(values: Record<string, string>): Promise<void>;

  preferencesRemove(key: string): Promise<void>;

  // File System API
  fsReadTextFile(path: string, baseDir?: string): Promise<string>;

  fsReadBinaryFile(path: string, baseDir?: string): Promise<Uint8Array>;

  fsWriteTextFile(path: string, contents: string, baseDir?: string): Promise<void>;

  fsWriteBinaryFile(path: string, contents: Uint8Array, baseDir?: string): Promise<void>;

  fsReadDir(path: string, baseDir?: string): Promise<DirEntry[]>;

  fsExists(path: string, baseDir?: string): Promise<boolean>;

  fsStat(path: string, baseDir?: string): Promise<FileStat>;

  // Shell API
  shellExecute(program: string, args: string[]): Promise<ShellResult>;

  shellExecuteSpawn(program: string, args: string[]): Promise<string>;

  // UI API
  uiClose(): Promise<void>;

  uiSetTitle(title: string): Promise<void>;

  uiHideWindow(): Promise<void>;

  uiGetTheme(): Promise<"light" | "dark">;

  /** Get main app CSS styles for injection into extension iframe */
  uiGetStyles(): Promise<string>;

  /** Get initial search value passed from main app */
  uiGetInitialSearch(): Promise<string>;

  // Actions API
  actionsRegister(actions: DynamicAction[]): Promise<void>;

  actionsUnregister(actionIds: string[]): Promise<void>;

  // OS API
  osPlatform(): Promise<"windows" | "linux" | "darwin">;
}

/** Callbacks for UI control from host side */
export interface RuaHostCallbacks {
  onClose?: () => void;
  onSetTitle?: (title: string) => void;
  onRegisterActions?: (actions: DynamicAction[]) => void;
  onUnregisterActions?: (actionIds: string[]) => void;
  /** Get initial search value */
  getInitialSearch?: () => string;
}

/** Client-side callbacks that host can invoke */
export interface RuaClientCallbacks {
  /** @internal Called when search input value changes. Internal use only - not exposed to view mode extensions */
  onSearchChange?: (query: string) => void;
  /** Called when the main window is activated (shown) */
  onActivate?: () => void;
  /** Called when the main window is deactivated (hidden) */
  onDeactivate?: () => void;
  /** Called when the application theme changes */
  onThemeChange?: (theme: "light" | "dark") => void;
}

/** Parsed permission with allow rules */
export interface ParsedPermission {
  /** Permission identifier (e.g., 'fs:read', 'shell:execute') */
  permission: string;
  /** Allowed paths (for fs permissions) */
  allowPaths?: string[];
  /** Allowed shell commands (for shell permission) */
  allowCommands?: Array<{ program: string; args?: string[] }>;
}

/** Extension info for the host */
export interface ExtensionHostInfo {
  id: string;
  name: string;
  version: string;
  /** Extension directory path (for resolving relative asset paths) */
  path?: string;
  /** Simple permission strings for backward compatibility */
  permissions: string[];
  /** Detailed parsed permissions with allow rules */
  parsedPermissions?: ParsedPermission[];
  /** Current action info from manifest (populated when running in view mode) */
  currentAction?: CurrentActionInfo;
}

/** State for a loaded background script */
export interface BackgroundScriptState {
  extensionId: string;
  scriptPath: string;
  loaded: boolean;
  error?: string;
  activateCallbacks: Set<() => void>;
  deactivateCallbacks: Set<() => void>;
  actionTriggeredCallbacks: Set<(data: ActionTriggeredData) => void>;
  searchChangeCallbacks: Set<(data: SearchChangeData) => void>;
  registeredActions: string[];
}

/** Callbacks for background script actions */
export interface BackgroundScriptCallbacks {
  onRegisterActions: (extensionId: string, actions: DynamicAction[]) => void;
  onUnregisterActions: (extensionId: string, actionIds: string[]) => void;
}
