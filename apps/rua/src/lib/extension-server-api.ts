/**
 * Extension Server API
 *
 * Rua-specific APIs exposed to extension iframes via kkrpc.
 */

import { invoke } from '@tauri-apps/api/core';
import type {
    ExtensionMeta,
    DynamicAction,
    RuaServerAPI,
    RuaHostCallbacks,
    ExtensionHostInfo
} from 'rua-api';

// Re-export types for convenience
export type { ExtensionMeta, DynamicAction, RuaHostCallbacks, RuaClientCallbacks, ExtensionHostInfo } from 'rua-api';

/** Alias for RuaServerAPI */
export type RuaAPI = RuaServerAPI;

/**
 * Check if extension has a specific permission
 */
function hasPermission(extensionInfo: ExtensionHostInfo, permission: string): boolean {
    return extensionInfo.permissions.includes(permission);
}

/**
 * Create Rua API implementation
 */
export function createRuaAPI(
    extensionInfo: ExtensionHostInfo,
    callbacks: RuaHostCallbacks
): RuaServerAPI {
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
            if (!hasPermission(extensionInfo, 'clipboard')) {
                throw new Error('PERMISSION_DENIED: clipboard permission required');
            }
            console.log("read_clipboard get 11111")
            return await invoke<string>('read_clipboard');
        },

        async clipboardWriteText(text: string): Promise<void> {
            if (!hasPermission(extensionInfo, 'clipboard')) {
                throw new Error('PERMISSION_DENIED: clipboard permission required');
            }
            await invoke('write_clipboard', { text });
        },

        // Notification API
        async notificationShow(options: { title: string; body?: string }): Promise<void> {
            if (!hasPermission(extensionInfo, 'notification')) {
                throw new Error('PERMISSION_DENIED: notification permission required');
            }
            await invoke('show_notification', options);
        },

        // Storage API
        async storageGet(key: string): Promise<string | null> {
            console.log(extensionInfo)
            if (!hasPermission(extensionInfo, 'storage')) {
                throw new Error('PERMISSION_DENIED: storage permission required');
            }
            console.log("storege get 11111")
            return await invoke('extension_storage_get', {
                extensionId: extensionInfo.id,
                key,
            });
        },

        async storageSet(key: string, value: string): Promise<void> {
            if (!hasPermission(extensionInfo, 'storage')) {
                throw new Error('PERMISSION_DENIED: storage permission required');
            }
            await invoke('extension_storage_set', {
                extensionId: extensionInfo.id,
                key,
                value,
            });
        },

        async storageRemove(key: string): Promise<void> {
            if (!hasPermission(extensionInfo, 'storage')) {
                throw new Error('PERMISSION_DENIED: storage permission required');
            }
            await invoke('extension_storage_remove', {
                extensionId: extensionInfo.id,
                key,
            });
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
