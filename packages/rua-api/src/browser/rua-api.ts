/**
 * Rua Extension API
 *
 * Provides the window.rua API for extensions running in iframes.
 * Uses kkrpc for communication with the host application.
 */

import {IframeChildIO, RPCChannel} from 'kkrpc/browser';
import type {RuaClientAPI, EventHandler, FsOptions} from '../types';
import {RuaServerAPI} from "../types/rua";

// Re-export types for convenience
export type {ExtensionMeta, DynamicAction, RuaClientAPI as RuaAPI} from '../types/rua';
export type {RuaClientAPI} from '../types/rua';
export {BaseDirectory} from '../types';

// Singleton instance
let ruaInstance: RuaClientAPI | null = null;
let initPromise: Promise<RuaClientAPI> | null = null;

/**
 * Inject CSS styles into the document
 */
function injectStyles(cssContent: string): void {
    // Remove old style tag if exists
    const oldStyle = document.getElementById('rua-main-app-styles');
    if (oldStyle) {
        oldStyle.remove();
    }

    // Create new style tag
    const styleElement = document.createElement('style');
    styleElement.id = 'rua-main-app-styles';
    styleElement.textContent = cssContent;

    // Insert at the beginning of head
    const head = document.head;
    if (head.firstChild) {
        head.insertBefore(styleElement, head.firstChild);
    } else {
        head.appendChild(styleElement);
    }
}

/**
 * Apply theme class to html element
 */
function applyTheme(theme: 'light' | 'dark'): void {
    const html = document.documentElement;
    if (theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
}

// Extend Window interface
declare global {
    interface Window {
        rua?: RuaClientAPI;
    }
}

/**
 * Initialize the Rua API for an extension
 * All APIs are accessed through the returned rua object
 *
 * Extension info (id, name, version) is automatically fetched from the host
 *
 * This function is idempotent - calling it multiple times returns the same instance
 */
export async function initializeRuaAPI(): Promise<RuaClientAPI> {
    // Return existing instance if already initialized
    if (ruaInstance) {
        return ruaInstance;
    }

    // Return existing promise if initialization is in progress
    if (initPromise) {
        return initPromise;
    }

    // Create initialization promise
    initPromise = (async () => {
        // Event handlers map
        const eventHandlers = new Map<string, EventHandler[]>();

        // Create kkrpc IO and channel with all callbacks
        const io = new IframeChildIO();
        const rpc = new RPCChannel(io, {
            expose: {
                onActionTriggered: async (actionId: string, context: unknown) => {
                    const handlers = eventHandlers.get('action-triggered') || [];
                    handlers.forEach((handler) => {
                        try {
                            handler({actionId, context});
                        } catch (e) {
                            console.error('[Rua API] Event handler error:', e);
                        }
                    });
                },
                onActivate: async () => {
                    const handlers = eventHandlers.get('activate') || [];
                    handlers.forEach((handler) => {
                        try {
                            handler(undefined);
                        } catch (e) {
                            console.error('[Rua API] Event handler error:', e);
                        }
                    });
                },
                onDeactivate: async () => {
                    const handlers = eventHandlers.get('deactivate') || [];
                    handlers.forEach((handler) => {
                        try {
                            handler(undefined);
                        } catch (e) {
                            console.error('[Rua API] Event handler error:', e);
                        }
                    });
                },
                onThemeChange: async (theme: 'light' | 'dark') => {
                    // Apply theme class to html element
                    applyTheme(theme);

                    const handlers = eventHandlers.get('theme-change') || [];
                    handlers.forEach((handler) => {
                        try {
                            handler(theme);
                        } catch (e) {
                            console.error('[Rua API] Event handler error:', e);
                        }
                    });
                },
            },
        });

        // Get the host API proxy
        const hostAPI = rpc.getAPI() as RuaServerAPI;

        // Get extension info from host (read from manifest)
        const extensionMeta = await hostAPI.getExtensionInfo();
        console.log('[Rua API] Extension info from host:', extensionMeta);

        // Get and inject main app CSS styles
        try {
            const cssStyles = await hostAPI.uiGetStyles();
            if (cssStyles) {
                injectStyles(cssStyles);
                console.log('[Rua API] Main app CSS injected:', cssStyles.length, 'bytes');
            }

            // Also apply theme class to html element
            const theme = await hostAPI.uiGetTheme();
            applyTheme(theme);
        } catch (err) {
            console.warn('[Rua API] Failed to inject styles:', err);
        }

        // Define the Rua API
        const ruaAPI: RuaClientAPI = {
            extension: extensionMeta,

            clipboard: {
                readText: () => hostAPI.clipboardReadText(),
                writeText: (text) => hostAPI.clipboardWriteText(text),
            },

            notification: {
                show: (options) => hostAPI.notificationShow(options),
            },

            storage: {
                get: async (key) => {
                    const value = await hostAPI.storageGet(key);
                    if (value === null || value === undefined) return null;
                    try {
                        return JSON.parse(value);
                    } catch {
                        return value as never;
                    }
                },
                set: (key, value) => hostAPI.storageSet(key, JSON.stringify(value)),
                remove: (key) => hostAPI.storageRemove(key),
            },

            fs: {
                readTextFile: (path: string, options?: FsOptions) => hostAPI.fsReadTextFile(path, options?.baseDir),
                readBinaryFile: async (path: string, options?: FsOptions) => {
                    const data = await hostAPI.fsReadBinaryFile(path, options?.baseDir);
                    return new Uint8Array(data);
                },
                writeTextFile: (path: string, contents: string, options?: FsOptions) => hostAPI.fsWriteTextFile(path, contents, options?.baseDir),
                writeBinaryFile: (path: string, contents: Uint8Array, options?: FsOptions) => hostAPI.fsWriteBinaryFile(path, contents, options?.baseDir),
                readDir: (path: string, options?: FsOptions) => hostAPI.fsReadDir(path, options?.baseDir),
                exists: (path: string, options?: FsOptions) => hostAPI.fsExists(path, options?.baseDir),
                stat: (path: string, options?: FsOptions) => hostAPI.fsStat(path, options?.baseDir),
            },

            shell: {
                execute: (program, args = [],) => hostAPI.shellExecute(program, args),
                executeSpawn: (program, args = []) => hostAPI.shellExecuteSpawn(program, args),
            },

            ui: {
                hideInput: () => hostAPI.uiHideInput(),
                showInput: () => hostAPI.uiShowInput(),
                close: () => hostAPI.uiClose(),
                setTitle: (title) => hostAPI.uiSetTitle(title),
                getTheme: () => hostAPI.uiGetTheme(),
                getInitialSearch: () => hostAPI.uiGetInitialSearch(),
            },

            hideWindow: () => hostAPI.uiHideWindow(),

            os: {
                platform: () => hostAPI.osPlatform(),
            },

            on: (event, handler) => {
                if (!eventHandlers.has(event)) {
                    eventHandlers.set(event, []);
                }
                eventHandlers.get(event)!.push(handler);
            },

            off: (event, handler) => {
                const handlers = eventHandlers.get(event);
                if (handlers) {
                    const index = handlers.indexOf(handler);
                    if (index > -1) {
                        handlers.splice(index, 1);
                    }
                }
            },
        };

        // Set on window and store singleton
        window.rua = ruaAPI;
        ruaInstance = ruaAPI;

        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('rua-ready', {detail: ruaAPI.extension}));

        console.log('[Rua API] Initialized for extension:', ruaAPI.extension.id);

        return ruaAPI;
    })();

    return initPromise;
}
