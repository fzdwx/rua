/**
 * Background Script Executor
 *
 * Executes extension background scripts when the rua application starts.
 * Background scripts run directly in the main program context (not in iframes).
 * Each extension can have at most one background action.
 */

import type { DynamicAction, ExtensionMeta, ExtensionHostInfo, ParsedPermission } from 'rua-api';
import {
    apiCore,
    hasSimplePermission,
    hasPathPermission,
    hasShellPermission,
    permissionError,
    type FileStat,
    type DirEntry,
    type ShellResult,
} from './rua-api-core';

// Re-export types
export type { FileStat, DirEntry, ShellResult } from './rua-api-core';

/** Timeout for script initialization (5 seconds) */
const SCRIPT_TIMEOUT = 5000;

/** Action triggered event data */
export interface ActionTriggeredData {
    actionId: string;
    context?: unknown;
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

/** Main context Rua API interface for background scripts */
export interface MainContextRuaAPI {
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
        readTextFile(path: string, options?: { baseDir?: string }): Promise<string>;
        readBinaryFile(path: string, options?: { baseDir?: string }): Promise<number[]>;
        writeTextFile(path: string, contents: string, options?: { baseDir?: string }): Promise<void>;
        writeBinaryFile(path: string, contents: number[], options?: { baseDir?: string }): Promise<void>;
        readDir(path: string, options?: { baseDir?: string }): Promise<DirEntry[]>;
        exists(path: string, options?: { baseDir?: string }): Promise<boolean>;
        stat(path: string, options?: { baseDir?: string }): Promise<FileStat>;
    };

    shell: {
        execute(program: string, args?: string[]): Promise<ShellResult>;
    };

    actions: {
        register(actions: DynamicAction[]): Promise<void>;
        unregister(actionIds: string[]): Promise<void>;
    };

    os: {
        platform(): Promise<string>;
    };

    on(event: 'activate' | 'deactivate', callback: () => void): void;
    on(event: 'action-triggered', callback: (data: ActionTriggeredData) => void): void;
    off(event: 'activate' | 'deactivate', callback: () => void): void;
    off(event: 'action-triggered', callback: (data: ActionTriggeredData) => void): void;
}

// Registry of loaded background scripts
const backgroundScripts = new Map<string, BackgroundScriptState>();

// Global callbacks for action registration
let globalCallbacks: BackgroundScriptCallbacks | null = null;

/**
 * Set global callbacks for action registration from background scripts
 */
export function setBackgroundCallbacks(callbacks: BackgroundScriptCallbacks | null): void {
    globalCallbacks = callbacks;
}

/**
 * Create the main context Rua API for a background script
 */
export function createMainContextRuaAPI(
    extensionInfo: ExtensionHostInfo,
    state: BackgroundScriptState
): MainContextRuaAPI {
    const checkPermission = (permission: string, detail?: string) => {
        if (!hasSimplePermission(extensionInfo.permissions, permission)) {
            throw permissionError(permission, detail);
        }
    };

    const checkPathPermission = (permission: string, path: string) => {
        if (!hasPathPermission(extensionInfo, permission, path)) {
            throw permissionError(permission, `path: ${path}`);
        }
    };

    const checkShellPermission = (program: string, args: string[]) => {
        if (!hasShellPermission(extensionInfo, program, args)) {
            throw permissionError('shell', `command: ${program} ${args.join(' ')}`);
        }
    };

    return {
        extension: {
            id: extensionInfo.id,
            name: extensionInfo.name,
            version: extensionInfo.version,
        },

        clipboard: {
            async readText(): Promise<string> {
                checkPermission('clipboard');
                return await apiCore.clipboardReadText();
            },
            async writeText(text: string): Promise<void> {
                checkPermission('clipboard');
                await apiCore.clipboardWriteText(text);
            },
        },

        notification: {
            async show(options: { title: string; body?: string }): Promise<void> {
                checkPermission('notification');
                await apiCore.notificationShow(options);
            },
        },

        storage: {
            async get<T>(key: string): Promise<T | null> {
                checkPermission('storage');
                const value = await apiCore.storageGet(extensionInfo.id, key);
                if (value === null) return null;
                try {
                    return JSON.parse(value) as T;
                } catch {
                    return value as unknown as T;
                }
            },
            async set<T>(key: string, value: T): Promise<void> {
                checkPermission('storage');
                // Always use JSON.stringify to ensure valid JSON for Rust backend
                const serialized = JSON.stringify(value);
                await apiCore.storageSet(extensionInfo.id, key, serialized);
            },
            async remove(key: string): Promise<void> {
                checkPermission('storage');
                await apiCore.storageRemove(extensionInfo.id, key);
            },
        },

        fs: {
            async readTextFile(path: string, options?: { baseDir?: string }): Promise<string> {
                const resolvedPath = apiCore.resolvePath(path, options?.baseDir);
                checkPathPermission('fs:read', resolvedPath);
                return await apiCore.fsReadTextFile(resolvedPath);
            },
            async readBinaryFile(path: string, options?: { baseDir?: string }): Promise<number[]> {
                const resolvedPath = apiCore.resolvePath(path, options?.baseDir);
                checkPathPermission('fs:read', resolvedPath);
                return await apiCore.fsReadBinaryFile(resolvedPath);
            },
            async writeTextFile(path: string, contents: string, options?: { baseDir?: string }): Promise<void> {
                const resolvedPath = apiCore.resolvePath(path, options?.baseDir);
                checkPathPermission('fs:write', resolvedPath);
                await apiCore.fsWriteTextFile(resolvedPath, contents);
            },
            async writeBinaryFile(path: string, contents: number[], options?: { baseDir?: string }): Promise<void> {
                const resolvedPath = apiCore.resolvePath(path, options?.baseDir);
                checkPathPermission('fs:write', resolvedPath);
                await apiCore.fsWriteBinaryFile(resolvedPath, contents);
            },
            async readDir(path: string, options?: { baseDir?: string }): Promise<DirEntry[]> {
                const resolvedPath = apiCore.resolvePath(path, options?.baseDir);
                checkPathPermission('fs:read-dir', resolvedPath);
                return await apiCore.fsReadDir(resolvedPath);
            },
            async exists(path: string, options?: { baseDir?: string }): Promise<boolean> {
                const resolvedPath = apiCore.resolvePath(path, options?.baseDir);
                checkPathPermission('fs:exists', resolvedPath);
                return await apiCore.fsExists(resolvedPath);
            },
            async stat(path: string, options?: { baseDir?: string }): Promise<FileStat> {
                const resolvedPath = apiCore.resolvePath(path, options?.baseDir);
                checkPathPermission('fs:stat', resolvedPath);
                return await apiCore.fsStat(resolvedPath);
            },
        },

        shell: {
            async execute(program: string, args: string[] = []): Promise<ShellResult> {
                checkShellPermission(program, args);
                const command = [program, ...args].join(' ');
                return await apiCore.shellExecute(command);
            },
        },

        actions: {
            async register(actions: DynamicAction[]): Promise<void> {
                console.log('[BackgroundExecutor] Registering actions for:', extensionInfo.id, actions);
                const actionIds = actions.map(a => a.id);
                state.registeredActions.push(...actionIds);
                globalCallbacks?.onRegisterActions(extensionInfo.id, actions);
            },
            async unregister(actionIds: string[]): Promise<void> {
                console.log('[BackgroundExecutor] Unregistering actions for:', extensionInfo.id, actionIds);
                state.registeredActions = state.registeredActions.filter(id => !actionIds.includes(id));
                globalCallbacks?.onUnregisterActions(extensionInfo.id, actionIds);
            },
        },

        os: {
            async platform(): Promise<string> {
                const platform = navigator.platform.toLowerCase();
                if (platform.includes('win')) return 'win32';
                if (platform.includes('mac')) return 'darwin';
                if (platform.includes('linux')) return 'linux';
                return platform;
            },
        },

        on(event: 'activate' | 'deactivate' | 'action-triggered', callback: (() => void) | ((data: ActionTriggeredData) => void)): void {
            if (event === 'activate') {
                state.activateCallbacks.add(callback as () => void);
            } else if (event === 'deactivate') {
                state.deactivateCallbacks.add(callback as () => void);
            } else if (event === 'action-triggered') {
                state.actionTriggeredCallbacks.add(callback as (data: ActionTriggeredData) => void);
            }
        },

        off(event: 'activate' | 'deactivate' | 'action-triggered', callback: (() => void) | ((data: ActionTriggeredData) => void)): void {
            if (event === 'activate') {
                state.activateCallbacks.delete(callback as () => void);
            } else if (event === 'deactivate') {
                state.deactivateCallbacks.delete(callback as () => void);
            } else if (event === 'action-triggered') {
                state.actionTriggeredCallbacks.delete(callback as (data: ActionTriggeredData) => void);
            }
        },
    };
}


/**
 * Convert extension path to importable URL
 * Uses the ext:// protocol for extension resources
 */
function convertToImportUrl(extensionPath: string, scriptPath: string): string {
    const fullPath = `${extensionPath}/${scriptPath}`;
    const lastSlash = fullPath.lastIndexOf('/');
    const baseDir = fullPath.substring(0, lastSlash);
    const fileName = fullPath.substring(lastSlash + 1);
    const encodedBaseDir = btoa(baseDir).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `ext://${encodedBaseDir}/${fileName}`;
}

/**
 * Execute a background script for an extension
 *
 * @param extensionId - The extension ID
 * @param extensionPath - The path to the extension directory
 * @param scriptPath - The relative path to the background script
 * @param extensionName - The extension display name
 * @param extensionVersion - The extension version
 * @param permissions - Simple permission strings
 * @param parsedPermissions - Detailed parsed permissions (optional)
 * @returns Promise that resolves to true if script loaded successfully
 */
export async function executeBackgroundScript(
    extensionId: string,
    extensionPath: string,
    scriptPath: string,
    extensionName: string,
    extensionVersion: string,
    permissions: string[] = [],
    parsedPermissions: ParsedPermission[] = []
): Promise<boolean> {
    // Clean up existing state if any
    cleanupExtension(extensionId);

    // Create state for this extension
    const state: BackgroundScriptState = {
        extensionId,
        scriptPath,
        loaded: false,
        activateCallbacks: new Set(),
        deactivateCallbacks: new Set(),
        actionTriggeredCallbacks: new Set(),
        registeredActions: [],
    };

    // Store state before loading (so cleanup can work if load fails)
    backgroundScripts.set(extensionId, state);

    // Create extension info for permission checking
    const extensionInfo: ExtensionHostInfo = {
        id: extensionId,
        name: extensionName,
        version: extensionVersion,
        permissions,
        parsedPermissions,
    };

    // Create the API for this extension
    const api = createMainContextRuaAPI(extensionInfo, state);

    // Set global extension ID and API before import
    (window as unknown as { __RUA_EXTENSION_ID__: string }).__RUA_EXTENSION_ID__ = extensionId;
    (window as unknown as { __RUA_API__: MainContextRuaAPI }).__RUA_API__ = api;

    const importUrl = convertToImportUrl(extensionPath, scriptPath);
    console.log('[BackgroundExecutor] Loading background script for:', extensionId, 'url:', importUrl);

    try {
        // Dynamic import with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Script initialization timeout')), SCRIPT_TIMEOUT)
        );

        const importPromise = import(/* @vite-ignore */ importUrl);

        await Promise.race([importPromise, timeoutPromise]);

        state.loaded = true;
        console.log('[BackgroundExecutor] Background script loaded:', extensionId);
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        state.error = errorMessage;

        if (errorMessage === 'Script initialization timeout') {
            console.warn('[BackgroundExecutor] Script initialization timeout for:', extensionId);
        } else {
            console.error('[BackgroundExecutor] Failed to load background script for:', extensionId, error);
        }

        return false;
    }
}


/**
 * Notify all extensions that the main window is activated
 */
export async function notifyActivate(): Promise<void> {
    console.log('[BackgroundExecutor] Notifying activate to', backgroundScripts.size, 'extensions');

    const promises: Promise<void>[] = [];

    for (const [extensionId, state] of backgroundScripts) {
        if (!state.loaded) continue;

        for (const callback of state.activateCallbacks) {
            promises.push(
                (async () => {
                    try {
                        callback();
                    } catch (error) {
                        console.warn('[BackgroundExecutor] Failed to notify activate:', extensionId, error);
                    }
                })()
            );
        }
    }

    await Promise.allSettled(promises);
}

/**
 * Notify all extensions that the main window is deactivated
 */
export async function notifyDeactivate(): Promise<void> {
    console.log('[BackgroundExecutor] Notifying deactivate to', backgroundScripts.size, 'extensions');

    const promises: Promise<void>[] = [];

    for (const [extensionId, state] of backgroundScripts) {
        if (!state.loaded) continue;

        for (const callback of state.deactivateCallbacks) {
            promises.push(
                (async () => {
                    try {
                        callback();
                    } catch (error) {
                        console.warn('[BackgroundExecutor] Failed to notify deactivate:', extensionId, error);
                    }
                })()
            );
        }
    }

    await Promise.allSettled(promises);
}

/**
 * Notify an extension that one of its dynamic actions was triggered
 * @param extensionId - The extension ID
 * @param actionId - The action ID (without extension prefix)
 * @param context - Optional context data
 */
export async function notifyActionTriggered(
    extensionId: string,
    actionId: string,
    context?: unknown
): Promise<void> {
    const state = backgroundScripts.get(extensionId);
    if (!state?.loaded) {
        console.warn('[BackgroundExecutor] Cannot notify action-triggered: extension not loaded:', extensionId);
        return;
    }

    console.log('[BackgroundExecutor] Notifying action-triggered:', extensionId, actionId);

    const data: ActionTriggeredData = { actionId, context };
    const promises: Promise<void>[] = [];

    for (const callback of state.actionTriggeredCallbacks) {
        promises.push(
            (async () => {
                try {
                    callback(data);
                } catch (error) {
                    console.warn('[BackgroundExecutor] Failed to notify action-triggered:', extensionId, error);
                }
            })()
        );
    }

    await Promise.allSettled(promises);
}

/**
 * Clean up a specific extension's background script state
 * Removes all callbacks and unregisters all dynamic actions
 */
export function cleanupExtension(extensionId: string): void {
    const state = backgroundScripts.get(extensionId);
    if (!state) return;

    console.log('[BackgroundExecutor] Cleaning up extension:', extensionId);

    // Unregister all dynamic actions for this extension
    if (state.registeredActions.length > 0 && globalCallbacks) {
        globalCallbacks.onUnregisterActions(extensionId, state.registeredActions);
    }

    // Clear callbacks
    state.activateCallbacks.clear();
    state.deactivateCallbacks.clear();

    // Remove from registry
    backgroundScripts.delete(extensionId);
}

/**
 * Get all loaded extension IDs
 */
export function getLoadedBackgroundExtensions(): string[] {
    return Array.from(backgroundScripts.keys());
}

/**
 * Check if an extension's background script is loaded
 */
export function isBackgroundScriptLoaded(extensionId: string): boolean {
    const state = backgroundScripts.get(extensionId);
    return state?.loaded ?? false;
}

/**
 * Get the state of a background script
 */
export function getBackgroundScriptState(extensionId: string): BackgroundScriptState | undefined {
    return backgroundScripts.get(extensionId);
}
