/**
 * Extension Server API
 *
 * Rua-specific APIs exposed to extension iframes via kkrpc.
 */

import {invoke} from '@tauri-apps/api/core';
import type {
    ExtensionMeta,
    DynamicAction,
    RuaServerAPI,
    RuaHostCallbacks,
    ExtensionHostInfo
} from 'rua-api';

// Re-export types for convenience
export type {ExtensionMeta, DynamicAction, RuaHostCallbacks, ExtensionHostInfo} from 'rua-api';

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
        actions: {
            register: async function (actions: DynamicAction[]) {
                callbacks.onRegisterActions?.(actions);
            },
            unregister: async function (actionIds: string[]) {
                callbacks.onUnregisterActions?.(actionIds);
            }
        },
        clipboard: {
            readText: async function () {
                if (!hasPermission(extensionInfo, 'clipboard')) {
                    throw new Error('PERMISSION_DENIED: clipboard permission required');
                }
                console.log("read_clipboard get 11111")
                return await invoke<string>('read_clipboard');
            },
            writeText: async function (text: string) {
                if (!hasPermission(extensionInfo, 'clipboard')) {
                    throw new Error('PERMISSION_DENIED: clipboard permission required');
                }
                await invoke('write_clipboard', {text});
            }
        },
        notification: {
            show: async function (options: { title: string; body?: string }) {
                if (!hasPermission(extensionInfo, 'notification')) {
                    throw new Error('PERMISSION_DENIED: notification permission required');
                }
                await invoke('show_notification', options);
            }
        },
        storage: {
            get: async function (key: string) {
                if (!hasPermission(extensionInfo, 'storage')) {
                    throw new Error('PERMISSION_DENIED: storage permission required');
                }
                return await invoke('extension_storage_get', {
                    extensionId: extensionInfo.id,
                    key,
                });
            },
            remove: async function (key: string) {
                if (!hasPermission(extensionInfo, 'storage')) {
                    throw new Error('PERMISSION_DENIED: storage permission required');
                }
                await invoke('extension_storage_remove', {
                    extensionId: extensionInfo.id,
                    key,
                });
            },
            set: async function (key: string, value: string) {
                if (!hasPermission(extensionInfo, 'storage')) {
                    throw new Error('PERMISSION_DENIED: storage permission required');
                }
                await invoke('extension_storage_set', {
                    extensionId: extensionInfo.id,
                    key,
                    value,
                });
            }
        },
        ui: {
            close: async function () {
                callbacks.onClose?.();
            },
            hideInput: async function () {
                callbacks.onHideInput?.();
            },
            setTitle: async function (title: string) {
                callbacks.onSetTitle?.(title);
            },
            showInput: async function () {
                callbacks.onShowInput?.();
            }
        },

        async getExtensionInfo(): Promise<ExtensionMeta> {
            return {
                id: extensionInfo.id,
                name: extensionInfo.name,
                version: extensionInfo.version,
            };
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
