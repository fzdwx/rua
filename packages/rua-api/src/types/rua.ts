/**
 * Rua Extension API Types
 *
 * Shared types between the host application and extension iframes.
 * These types define the contract for Rua-specific APIs.
 */

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
    icon?: string;
    subtitle?: string;
    mode: 'view' | 'command';
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
    /** Icon */
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

/**
 * Rua API interface (client-side)
 * This is what extensions use via window.rua
 */
export interface RuaClientAPI {
    extension: ExtensionMeta;

    clipboard: {
        readText(): Promise<string>;
        writeText(text: string): Promise<void>;
    };

    notification: {
        show(options: { title: string; body?: string }): Promise<void>;
    };

    storage: {
        get<T>(key: string): Promise<T | null>;
        set<T>(key: string, value: T): Promise<void>;
        remove(key: string): Promise<void>;
    };

    fs: {
        /** Read file contents as text (requires fs:read permission) */
        readTextFile(path: string): Promise<string>;
        /** Read file contents as binary (requires fs:read permission) */
        readBinaryFile(path: string): Promise<Uint8Array>;
        /** Write text to file (requires fs:write permission) */
        writeTextFile(path: string, contents: string): Promise<void>;
        /** Write binary data to file (requires fs:write permission) */
        writeBinaryFile(path: string, contents: Uint8Array): Promise<void>;
        /** Read directory contents (requires fs:read-dir permission) */
        readDir(path: string): Promise<DirEntry[]>;
        /** Check if file/directory exists (requires fs:exists permission) */
        exists(path: string): Promise<boolean>;
        /** Get file/directory metadata (requires fs:stat permission) */
        stat(path: string): Promise<FileStat>;
    };

    shell: {
        /** Execute a shell command (requires shell permission with matching allow rules) */
        execute(program: string, args?: string[]): Promise<ShellResult>;
    };

    ui: {
        hideInput(): Promise<void>;
        showInput(): Promise<void>;
        close(): Promise<void>;
        setTitle(title: string): Promise<void>;
    };

    actions: {
        register(actions: DynamicAction[]): Promise<void>;
        unregister(actionIds: string[]): Promise<void>;
    };

    on(event: string, handler: EventHandler): void;

    off(event: string, handler: EventHandler): void;
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
    fsReadTextFile(path: string): Promise<string>;

    fsReadBinaryFile(path: string): Promise<number[]>;

    fsWriteTextFile(path: string, contents: string): Promise<void>;

    fsWriteBinaryFile(path: string, contents: number[]): Promise<void>;

    fsReadDir(path: string): Promise<DirEntry[]>;

    fsExists(path: string): Promise<boolean>;

    fsStat(path: string): Promise<FileStat>;

    // Shell API
    shellExecute(program: string, args: string[]): Promise<ShellResult>;

    // UI API
    uiHideInput(): Promise<void>;

    uiShowInput(): Promise<void>;

    uiClose(): Promise<void>;

    uiSetTitle(title: string): Promise<void>;

    // Actions API
    actionsRegister(actions: DynamicAction[]): Promise<void>;

    actionsUnregister(actionIds: string[]): Promise<void>;
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
