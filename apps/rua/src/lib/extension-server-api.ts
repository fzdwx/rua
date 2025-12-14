/**
 * Extension Server API
 *
 * Rua-specific APIs exposed to extension iframes via kkrpc.
 */

import type {
    ExtensionMeta,
    DynamicAction,
    RuaServerAPI,
    RuaHostCallbacks,
    ExtensionHostInfo,
} from 'rua-api';
import {apiCore, hasPathPermission, hasShellPermission, hasSimplePermission, permissionError} from './rua-api-core';

// Re-export types for convenience
export type { ExtensionMeta, DynamicAction, RuaHostCallbacks, RuaClientCallbacks, ExtensionHostInfo } from 'rua-api';

/** Alias for RuaServerAPI */
export type RuaAPI = RuaServerAPI;

/**
 * Create Rua API implementation
 */
export function createRuaAPI(
    extensionInfo: ExtensionHostInfo,
    callbacks: RuaHostCallbacks
): RuaServerAPI {
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
        async getExtensionInfo(): Promise<ExtensionMeta> {
            return {
                id: extensionInfo.id,
                name: extensionInfo.name,
                version: extensionInfo.version,
            };
        },

        // Clipboard API
        async clipboardReadText(): Promise<string> {
            checkPermission('clipboard');
            return await apiCore.clipboardReadText();
        },

        async clipboardWriteText(text: string): Promise<void> {
            checkPermission('clipboard');
            await apiCore.clipboardWriteText(text);
        },

        // Notification API
        async notificationShow(options: { title: string; body?: string }): Promise<void> {
            checkPermission('notification');
            await apiCore.notificationShow(options);
        },

        // Storage API
        async storageGet(key: string): Promise<string | null> {
            checkPermission('storage');
            return await apiCore.storageGet(extensionInfo.id, key);
        },

        async storageSet(key: string, value: string): Promise<void> {
            checkPermission('storage');
            await apiCore.storageSet(extensionInfo.id, key, value);
        },

        async storageRemove(key: string): Promise<void> {
            checkPermission('storage');
            await apiCore.storageRemove(extensionInfo.id, key);
        },

        // File System API
        async fsReadTextFile(path: string): Promise<string> {
            checkPathPermission('fs:read', path);
            return await apiCore.fsReadTextFile(path);
        },

        async fsReadBinaryFile(path: string): Promise<number[]> {
            checkPathPermission('fs:read', path);
            return await apiCore.fsReadBinaryFile(path);
        },

        async fsWriteTextFile(path: string, contents: string): Promise<void> {
            checkPathPermission('fs:write', path);
            await apiCore.fsWriteTextFile(path, contents);
        },

        async fsWriteBinaryFile(path: string, contents: number[]): Promise<void> {
            checkPathPermission('fs:write', path);
            await apiCore.fsWriteBinaryFile(path, contents);
        },

        async fsReadDir(path: string): Promise<{ name: string; isFile: boolean; isDirectory: boolean }[]> {
            checkPathPermission('fs:read-dir', path);
            return await apiCore.fsReadDir(path);
        },

        async fsExists(path: string): Promise<boolean> {
            checkPathPermission('fs:exists', path);
            return await apiCore.fsExists(path);
        },

        async fsStat(path: string): Promise<{ size: number; isFile: boolean; isDirectory: boolean; mtime: number; ctime: number }> {
            checkPathPermission('fs:stat', path);
            return await apiCore.fsStat(path);
        },

        // Shell API
        async shellExecute(program: string, args: string[]): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number | null }> {
            checkShellPermission(program, args);
            const command = [program, ...args].join(' ');
            return await apiCore.shellExecute(command);
        },

        // UI API (no permission required)
        async uiHideInput(): Promise<void> {
            callbacks.onHideInput?.();
        },

        async uiShowInput(): Promise<void> {
            callbacks.onShowInput?.();
        },

        async uiClose(): Promise<void> {
            callbacks.onClose?.();
        },

        async uiSetTitle(title: string): Promise<void> {
            callbacks.onSetTitle?.(title);
        },

        // Actions API (no permission required)
        async actionsRegister(actions: DynamicAction[]): Promise<void> {
            callbacks.onRegisterActions?.(actions);
        },

        async actionsUnregister(actionIds: string[]): Promise<void> {
            callbacks.onUnregisterActions?.(actionIds);
        },
    };
}

/**
 * Create the server API for extensions
 */
export function createExtensionServerAPI(
    extensionInfo: ExtensionHostInfo,
    callbacks: RuaHostCallbacks
): RuaServerAPI {
    return createRuaAPI(extensionInfo, callbacks);
}

export type ExtensionServerAPI = RuaServerAPI;
