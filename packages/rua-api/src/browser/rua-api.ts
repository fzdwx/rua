/**
 * Rua Extension API
 *
 * Provides the window.rua API for extensions running in iframes.
 * Uses kkrpc for communication with the host application.
 */

import {IframeChildIO, RPCChannel} from 'kkrpc/browser';
import type {RuaClientAPI, RuaServerAPI, EventHandler} from '../types';

// Re-export types for convenience
export type {ExtensionMeta, DynamicAction, RuaClientAPI as RuaAPI} from '../types/rua';
export type {RuaClientAPI} from '../types/rua';

// Singleton instance
let ruaInstance: RuaClientAPI | null = null;
let initPromise: Promise<RuaClientAPI> | null = null;

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

        // Create kkrpc IO and channel
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
            },
        });

        // Get the host API proxy
        const hostAPI = rpc.getAPI() as RuaServerAPI;

        // Get extension info from host (read from manifest)
        const extensionMeta = await hostAPI.getExtensionInfo();
        console.log('[Rua API] Extension info from host:', extensionMeta);

        // Define the Rua API
        const ruaAPI: RuaClientAPI = {
            extension: extensionMeta,

            clipboard: {
                readText: () => hostAPI.clipboard.readText(),
                writeText: (text) => hostAPI.clipboard.writeText(text),
            },

            notification: {
                show: (options) => hostAPI.notification.show(options),
            },

            storage: {
                get: async (key) => {
                    return hostAPI.storage.get(key)
                },
                set: (key, value) => hostAPI.storage.set(key, JSON.stringify(value)),
                remove: (key) => hostAPI.storage.remove(key),
            },

            ui: {
                hideInput: () => hostAPI.ui.hideInput(),
                showInput: () => hostAPI.ui.showInput(),
                close: () => hostAPI.ui.close(),
                setTitle: (title) => hostAPI.ui.setTitle(title),
            },

            actions: {
                register: (actions) => hostAPI.actions.register(actions),
                unregister: (actionIds) => hostAPI.actions.unregister(actionIds),
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
