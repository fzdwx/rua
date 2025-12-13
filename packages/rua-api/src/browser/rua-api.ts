/**
 * Rua Extension API
 * 
 * Provides the window.rua API for extensions running in iframes.
 * Uses tauri-api-adapter for Tauri API access and kkrpc for communication.
 */

import { IframeChildIO, RPCChannel } from 'kkrpc/browser';
// Re-export tauri-api-adapter iframe APIs for direct use
export { clipboard, dialog, fetch, fs, notification, os, shell, sysInfo, network } from 'tauri-api-adapter/iframe';

/** Extension metadata */
export interface ExtensionMeta {
  id: string;
  name: string;
  version: string;
}

/** Notification options */
export interface NotificationOptions {
  title: string;
  body?: string;
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

/** Event handler type */
type EventHandler = (data: unknown) => void;

/**
 * Rua-specific API (UI control, storage, actions)
 */
export interface RuaAPI {
  extension: ExtensionMeta;

  storage: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
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

// Extend Window interface
declare global {
  interface Window {
    rua?: RuaAPI;
  }
}

/**
 * Initialize the Rua-specific API for an extension
 * Note: For Tauri APIs (clipboard, fs, etc.), use the re-exported APIs from tauri-api-adapter
 */
export async function initializeRuaAPI(extensionMeta: ExtensionMeta): Promise<RuaAPI> {
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
            handler({ actionId, context });
          } catch (e) {
            console.error('[Rua API] Event handler error:', e);
          }
        });
      },
    },
  });

  // Get the host API proxy (Rua-specific methods)
  const hostAPI = rpc.getAPI() as {
    getExtensionInfo(): Promise<ExtensionMeta>;
    storageGet(key: string): Promise<string | null>;
    storageSet(key: string, value: string): Promise<void>;
    storageRemove(key: string): Promise<void>;
    uiHideInput(): Promise<void>;
    uiShowInput(): Promise<void>;
    uiClose(): Promise<void>;
    uiSetTitle(title: string): Promise<void>;
    actionsRegister(actions: DynamicAction[]): Promise<void>;
    actionsUnregister(actionIds: string[]): Promise<void>;
  };

  // Define the Rua-specific API
  const ruaAPI: RuaAPI = {
    extension: extensionMeta,

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

    ui: {
      hideInput: () => hostAPI.uiHideInput(),
      showInput: () => hostAPI.uiShowInput(),
      close: () => hostAPI.uiClose(),
      setTitle: (title) => hostAPI.uiSetTitle(title),
    },

    actions: {
      register: (actions) => hostAPI.actionsRegister(actions),
      unregister: (actionIds) => hostAPI.actionsUnregister(actionIds),
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

  // Set on window
  window.rua = ruaAPI;

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('rua-ready', { detail: extensionMeta }));

  console.log('[Rua API] Initialized for extension:', extensionMeta.id);

  return ruaAPI;
}
