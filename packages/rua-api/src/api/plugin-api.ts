/**
 * Plugin API Implementation
 * 
 * Provides the API interface for plugins to interact with the host application.
 * Based on Requirements 4.1, 4.2, 4.3, 5.1, 5.3
 */

import type { ComponentType } from 'react';
import type {
  PluginAPI,
  ClipboardAPI,
  NotificationAPI,
  StorageAPI,
  NotificationOptions,
  EventHandler,
} from '../types/api';
import type { PluginAction, ViewProps, RegisteredAction } from '../types/action';
import type { PluginManifest, PluginPermission } from '../types/manifest';

/**
 * Action store interface for registering/unregistering actions
 */
export interface ActionStore {
  register(actions: RegisteredAction[]): void;
  unregister(actionIds: string[]): void;
  has(actionId: string): boolean;
}

/**
 * View store interface for registering custom views
 */
export interface ViewStore {
  register(actionId: string, component: ComponentType<ViewProps>): void;
  unregister(actionId: string): void;
}

/**
 * Platform APIs interface
 */
export interface PlatformAPIs {
  clipboard?: {
    read(): Promise<string>;
    write(text: string): Promise<void>;
  };
  notification?: {
    show(options: NotificationOptions): Promise<void>;
  };
  storage?: {
    get(namespace: string, key: string): Promise<unknown>;
    set(namespace: string, key: string, value: unknown): Promise<void>;
    remove(namespace: string, key: string): Promise<void>;
    keys(namespace: string): Promise<string[]>;
    clear(namespace: string): Promise<void>;
  };
}

/**
 * Plugin API factory options
 */
export interface PluginAPIOptions {
  pluginId: string;
  manifest: PluginManifest;
  actionStore: ActionStore;
  viewStore?: ViewStore;
  platformAPIs?: PlatformAPIs;
}

/**
 * Event emitter for plugin events
 */
class PluginEventEmitter {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on<T>(event: string, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler as EventHandler);
  }

  emit<T>(event: string, data?: T): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (e) {
        console.error(`Error in plugin event handler for ${event}:`, e);
      }
    });
  }
}

/**
 * Check if plugin has a specific permission
 */
function hasPermission(manifest: PluginManifest, permission: PluginPermission): boolean {
  return manifest.permissions?.includes(permission) ?? false;
}

/**
 * Create a permission-gated API wrapper
 */
function createPermissionGate<T>(
  manifest: PluginManifest,
  permission: PluginPermission,
  api: T | undefined,
  apiName: string
): T {
  if (!api) {
    return createDummyAPI(apiName) as T;
  }

  if (!hasPermission(manifest, permission)) {
    return createPermissionDeniedAPI(manifest.id, permission, apiName) as T;
  }

  return api;
}

/**
 * Create a dummy API that logs warnings
 */
function createDummyAPI(apiName: string): Record<string, () => Promise<never>> {
  return new Proxy({}, {
    get: (_, method) => {
      return async () => {
        console.warn(`${apiName}.${String(method)} is not available in this environment`);
        throw new Error(`${apiName} is not available`);
      };
    },
  });
}

/**
 * Create an API that denies access due to missing permission
 */
function createPermissionDeniedAPI(
  pluginId: string,
  permission: PluginPermission,
  apiName: string
): Record<string, () => Promise<never>> {
  return new Proxy({}, {
    get: (_, method) => {
      return async () => {
        console.warn(
          `Plugin ${pluginId} attempted to use ${apiName}.${String(method)} without '${permission}' permission`
        );
        throw new Error(`Permission denied: '${permission}' permission required for ${apiName}`);
      };
    },
  });
}

/**
 * Create Plugin API instance
 */
export function createPluginAPI(options: PluginAPIOptions): PluginAPI {
  const { pluginId, manifest, actionStore, viewStore, platformAPIs } = options;
  const emitter = new PluginEventEmitter();
  const registeredActionIds: Set<string> = new Set();

  // Clipboard API with permission check
  const clipboard: ClipboardAPI = createPermissionGate(
    manifest,
    'clipboard',
    platformAPIs?.clipboard,
    'clipboard'
  );

  // Notification API with permission check
  const notification: NotificationAPI = createPermissionGate(
    manifest,
    'notification',
    platformAPIs?.notification,
    'notification'
  );

  // Storage API with permission check and namespace
  let storage: StorageAPI;
  if (hasPermission(manifest, 'storage') && platformAPIs?.storage) {
    storage = {
      get: <T>(key: string) => platformAPIs.storage!.get(pluginId, key) as Promise<T | null>,
      set: <T>(key: string, value: T) => platformAPIs.storage!.set(pluginId, key, value),
      remove: (key: string) => platformAPIs.storage!.remove(pluginId, key),
      keys: () => platformAPIs.storage!.keys(pluginId),
      clear: () => platformAPIs.storage!.clear(pluginId),
    };
  } else {
    storage = createDummyAPI('storage') as unknown as StorageAPI;
  }

  const api: PluginAPI = {
    pluginId,

    registerActions(actions: PluginAction[]): void {
      const registeredActions: RegisteredAction[] = [];

      for (const action of actions) {
        // Create namespaced ID
        const namespacedId = `${pluginId}.${action.id}`;

        // Validate parent if specified
        if (action.parent) {
          const parentId = action.parent.includes('.') 
            ? action.parent 
            : `${pluginId}.${action.parent}`;
          
          if (!actionStore.has(parentId) && !registeredActionIds.has(parentId)) {
            console.error(
              `Plugin ${pluginId}: Cannot register action '${action.id}' - parent '${action.parent}' not found`
            );
            continue;
          }
        }

        const registered: RegisteredAction = {
          ...action,
          id: namespacedId,
          originalId: action.id,
          pluginId,
          parent: action.parent 
            ? (action.parent.includes('.') ? action.parent : `${pluginId}.${action.parent}`)
            : undefined,
        };

        registeredActions.push(registered);
        registeredActionIds.add(namespacedId);
      }

      if (registeredActions.length > 0) {
        actionStore.register(registeredActions);
      }
    },

    unregisterActions(actionIds: string[]): void {
      const namespacedIds = actionIds.map(id => 
        id.includes('.') ? id : `${pluginId}.${id}`
      );
      
      actionStore.unregister(namespacedIds);
      namespacedIds.forEach(id => registeredActionIds.delete(id));
    },

    registerView(actionId: string, component: ComponentType<ViewProps>): void {
      if (!viewStore) {
        console.warn(`Plugin ${pluginId}: View store not available`);
        return;
      }

      const namespacedId = actionId.includes('.') ? actionId : `${pluginId}.${actionId}`;
      viewStore.register(namespacedId, component);
    },

    clipboard,
    notification,
    storage,

    on<T>(event: string, handler: EventHandler<T>): void {
      emitter.on(event, handler);
    },

    off<T>(event: string, handler: EventHandler<T>): void {
      emitter.off(event, handler);
    },

    emit<T>(event: string, data?: T): void {
      emitter.emit(event, data);
    },
  };

  return api;
}

/**
 * Get all action IDs registered by a plugin API instance
 * This is useful for cleanup when unloading a plugin
 */
export function getRegisteredActionIds(_api: PluginAPI): string[] {
  // This would need to be tracked internally
  // For now, return empty array - actual implementation would track this
  return [];
}
