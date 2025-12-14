/**
 * Main Context Rua API
 *
 * Provides the Rua API for extension background scripts running in the main program context.
 * Unlike the iframe-based API, this runs directly in the main window without RPC communication.
 *
 * Usage in background scripts:
 *   import { createMainContextRuaAPI } from 'rua-api/browser';
 *   const rua = createMainContextRuaAPI();
 *   await rua.storage.set('key', value);
 *   rua.on('activate', () => console.log('Window activated'));
 */

import type { ExtensionMeta, DynamicAction } from '../types/rua';

// Re-export types for convenience
export type { ExtensionMeta, DynamicAction } from '../types/rua';

/** File stat result */
export interface FileStat {
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    mtime: number;
    ctime: number;
}

/** Directory entry */
export interface DirEntry {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
}

/** Shell execution result */
export interface ShellResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number | null;
}

/**
 * Main Context Rua API interface for background scripts
 * Provides full API access for background scripts running in the main program context.
 */
export interface MainContextRuaAPI {
    /** Extension metadata */
    extension: ExtensionMeta;

    /** Clipboard API for reading/writing clipboard */
    clipboard: {
        /** Read text from clipboard */
        readText(): Promise<string>;
        /** Write text to clipboard */
        writeText(text: string): Promise<void>;
    };

    /** Notification API for showing system notifications */
    notification: {
        /** Show a system notification */
        show(options: { title: string; body?: string }): Promise<void>;
    };

    /** Storage API for persisting extension data */
    storage: {
        /** Get a value from extension storage */
        get<T>(key: string): Promise<T | null>;
        /** Set a value in extension storage */
        set<T>(key: string, value: T): Promise<void>;
        /** Remove a value from extension storage */
        remove(key: string): Promise<void>;
    };

    /** File System API for reading/writing files */
    fs: {
        /** Read a text file */
        readTextFile(path: string, options?: { baseDir?: string }): Promise<string>;
        /** Read a binary file */
        readBinaryFile(path: string, options?: { baseDir?: string }): Promise<number[]>;
        /** Write a text file */
        writeTextFile(path: string, contents: string, options?: { baseDir?: string }): Promise<void>;
        /** Write a binary file */
        writeBinaryFile(path: string, contents: number[], options?: { baseDir?: string }): Promise<void>;
        /** Read directory contents */
        readDir(path: string, options?: { baseDir?: string }): Promise<DirEntry[]>;
        /** Check if a path exists */
        exists(path: string, options?: { baseDir?: string }): Promise<boolean>;
        /** Get file/directory stats */
        stat(path: string, options?: { baseDir?: string }): Promise<FileStat>;
    };

    /** Shell API for executing commands */
    shell: {
        /** Execute a shell command */
        execute(program: string, args?: string[]): Promise<ShellResult>;
    };

    /** Actions API for registering dynamic actions */
    actions: {
        /** Register dynamic actions that appear in the command palette */
        register(actions: DynamicAction[]): Promise<void>;
        /** Unregister previously registered actions */
        unregister(actionIds: string[]): Promise<void>;
    };

    /** OS API for getting platform information */
    os: {
        /** Get the current platform (e.g., 'linux', 'darwin', 'win32') */
        platform(): Promise<string>;
    };

    /** Register an event handler for lifecycle events */
    on(event: 'activate' | 'deactivate' | 'action-triggered', callback: (() => void) | ((data: { actionId: string; context?: unknown }) => void)): void;

    /** Unregister an event handler */
    off(event: 'activate' | 'deactivate' | 'action-triggered', callback: (() => void) | ((data: { actionId: string; context?: unknown }) => void)): void;
}

// Extend Window interface for global variables set by the executor
declare global {
    interface Window {
        /** Extension ID injected by the background executor */
        __RUA_EXTENSION_ID__?: string;
        /** Main context API injected by the background executor */
        __RUA_API__?: MainContextRuaAPI;
    }
}

/**
 * Create the main context Rua API for a background script
 *
 * This function retrieves the API instance that was injected by the background executor.
 * It should only be called from background scripts (mode: "background" in manifest).
 *
 * @returns The MainContextRuaAPI instance for this extension
 * @throws Error if called outside of a background script context
 *
 * @example
 * ```typescript
 * import { createMainContextRuaAPI } from 'rua-api/browser';
 *
 * const rua = createMainContextRuaAPI();
 *
 * // Register dynamic actions
 * await rua.actions.register([
 *   { id: 'my-action', name: 'My Action', mode: 'command' }
 * ]);
 *
 * // Listen for window activation
 * rua.on('activate', () => {
 *   console.log('Main window activated');
 * });
 *
 * // Use storage
 * await rua.storage.set('lastRun', Date.now());
 * ```
 */
export function createMainContextRuaAPI(): MainContextRuaAPI {
    // Check if we're in a background script context
    if (!window.__RUA_API__) {
        throw new Error(
            'createMainContextRuaAPI() must be called from a background script context. ' +
            'Make sure your script is configured as a background action (mode: "background") in manifest.json.'
        );
    }

    if (!window.__RUA_EXTENSION_ID__) {
        throw new Error(
            'Extension ID not found. This indicates the background executor did not properly initialize the context.'
        );
    }

    return window.__RUA_API__;
}

/**
 * Get the current extension ID in a background script context
 *
 * @returns The extension ID
 * @throws Error if called outside of a background script context
 */
export function getExtensionId(): string {
    if (!window.__RUA_EXTENSION_ID__) {
        throw new Error(
            'getExtensionId() must be called from a background script context. ' +
            'Make sure your script is configured as a background action (mode: "background") in manifest.json.'
        );
    }

    return window.__RUA_EXTENSION_ID__;
}
