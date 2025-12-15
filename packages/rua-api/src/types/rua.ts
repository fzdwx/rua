/**
 * Rua Extension API Types
 *
 * Shared types between the host application and extension iframes.
 * These types define the contract for Rua-specific APIs.
 */

import {CommonRuaAPI} from "../browser";

/** Extension metadata */
export interface ExtensionMeta {
    id: string;
    name: string;
    version: string;
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
    mode: 'view' | 'command';
    section?: string;
    badge?: string  // Badge text to display on the right side of the action
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
    mode: 'view';
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

/** Event handler type */
export type EventHandler = (data: unknown) => void;

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
    Home = 'home',
    /** Application data directory */
    AppData = 'appData',
    /** Application local data directory */
    AppLocalData = 'appLocalData',
    /** Application config directory */
    AppConfig = 'appConfig',
    /** Desktop directory */
    Desktop = 'desktop',
    /** Documents directory */
    Document = 'document',
    /** Downloads directory */
    Download = 'download',
    /** Pictures directory */
    Picture = 'picture',
    /** Videos directory */
    Video = 'video',
    /** Music directory */
    Audio = 'audio',
    /** Temporary directory */
    Temp = 'temp',
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
        hideInput(): Promise<void>;
        showInput(): Promise<void>;
        /** close action back to main view */
        close(): Promise<void>;
        setTitle(title: string): Promise<void>;
    };

    on(event: 'activate' | 'deactivate' | 'action-triggered' | 'search-change', handler: EventHandler): void;

    off(event: 'activate' | 'deactivate' | 'action-triggered' | 'search-change', handler: EventHandler): void;
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

    // File System API
    fsReadTextFile(path: string, baseDir?: string): Promise<string>;

    fsReadBinaryFile(path: string, baseDir?: string): Promise<number[]>;

    fsWriteTextFile(path: string, contents: string, baseDir?: string): Promise<void>;

    fsWriteBinaryFile(path: string, contents: number[], baseDir?: string): Promise<void>;

    fsReadDir(path: string, baseDir?: string): Promise<DirEntry[]>;

    fsExists(path: string, baseDir?: string): Promise<boolean>;

    fsStat(path: string, baseDir?: string): Promise<FileStat>;

    // Shell API
    shellExecute(program: string, args: string[], spawn?: boolean): Promise<ShellResult | string>;

    // UI API
    uiHideInput(): Promise<void>;

    uiShowInput(): Promise<void>;

    uiClose(): Promise<void>;

    uiSetTitle(title: string): Promise<void>;

    uiHideWindow(): Promise<void>

    // Actions API
    actionsRegister(actions: DynamicAction[]): Promise<void>;

    actionsUnregister(actionIds: string[]): Promise<void>;

    // OS API
    osPlatform(): Promise<'windows' | 'linux' | 'darwin'>;
}


/** Action triggered event data */
export interface ActionTriggeredData {
    actionId: string;
    context?: unknown;
}


/** Callbacks for UI control from host side */
export interface RuaHostCallbacks {
    onHideInput?: () => void;
    onShowInput?: () => void;
    onClose?: () => void;
    onSetTitle?: (title: string) => void;
    onRegisterActions?: (actions: DynamicAction[]) => void;
    onUnregisterActions?: (actionIds: string[]) => void;
}

/** Client-side callbacks that host can invoke */
export interface RuaClientCallbacks {
    /** Called when search input value changes */
    onSearchChange?: (query: string) => void;
    /** Called when the main window is activated (shown) */
    onActivate?: () => void;
    /** Called when the main window is deactivated (hidden) */
    onDeactivate?: () => void;
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
    /** Simple permission strings for backward compatibility */
    permissions: string[];
    /** Detailed parsed permissions with allow rules */
    parsedPermissions?: ParsedPermission[];
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
    registeredActions: string[];
}

/** Callbacks for background script actions */
export interface BackgroundScriptCallbacks {
    onRegisterActions: (extensionId: string, actions: DynamicAction[]) => void;
    onUnregisterActions: (extensionId: string, actionIds: string[]) => void;
}