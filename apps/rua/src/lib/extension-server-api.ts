/**
 * Extension Server API
 * 
 * Combines tauri-api-adapter's server API with Rua-specific APIs.
 * This is exposed to extension iframes via kkrpc.
 */

import { constructServerAPIWithPermissions } from 'tauri-api-adapter';
import type { AllPermission } from 'tauri-api-adapter/permissions';
import { invoke } from '@tauri-apps/api/core';

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

/** Callbacks for UI control from host side */
export interface RuaHostCallbacks {
  onHideInput?: () => void;
  onShowInput?: () => void;
  onClose?: () => void;
  onSetTitle?: (title: string) => void;
  onRegisterActions?: (actions: DynamicAction[]) => void;
  onUnregisterActions?: (actionIds: string[]) => void;
}

/** Extension info for the host */
export interface ExtensionHostInfo {
  id: string;
  name: string;
  version: string;
  permissions: string[];
}

/**
 * Rua-specific API methods exposed to extensions
 */
export interface RuaAPI {
  // Extension info
  getExtensionInfo(): Promise<ExtensionMeta>;
  
  // Storage API (Rua-specific, per-extension storage)
  storageGet(key: string): Promise<string | null>;
  storageSet(key: string, value: string): Promise<void>;
  storageRemove(key: string): Promise<void>;
  
  // UI API
  uiHideInput(): Promise<void>;
  uiShowInput(): Promise<void>;
  uiClose(): Promise<void>;
  uiSetTitle(title: string): Promise<void>;
  
  // Actions API
  actionsRegister(actions: DynamicAction[]): Promise<void>;
  actionsUnregister(actionIds: string[]): Promise<void>;
}

/**
 * Create Rua-specific API implementation
 */
export function createRuaAPI(
  extensionInfo: ExtensionHostInfo,
  callbacks: RuaHostCallbacks
): RuaAPI {
  return {
    async getExtensionInfo(): Promise<ExtensionMeta> {
      return {
        id: extensionInfo.id,
        name: extensionInfo.name,
        version: extensionInfo.version,
      };
    },

    async storageGet(key: string): Promise<string | null> {
      return await invoke('extension_storage_get', {
        extensionId: extensionInfo.id,
        key,
      });
    },

    async storageSet(key: string, value: string): Promise<void> {
      await invoke('extension_storage_set', {
        extensionId: extensionInfo.id,
        key,
        value,
      });
    },

    async storageRemove(key: string): Promise<void> {
      await invoke('extension_storage_remove', {
        extensionId: extensionInfo.id,
        key,
      });
    },

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

    async actionsRegister(actions: DynamicAction[]): Promise<void> {
      callbacks.onRegisterActions?.(actions);
    },

    async actionsUnregister(actionIds: string[]): Promise<void> {
      callbacks.onUnregisterActions?.(actionIds);
    },
  };
}

/**
 * Map Rua permissions to tauri-api-adapter permissions
 */
export function mapRuaPermissionsToTauriPermissions(ruaPermissions: string[]): AllPermission[] {
  const permissionMap: Record<string, AllPermission[]> = {
    'clipboard': ['clipboard:read-all', 'clipboard:write-all'],
    'notification': ['notification:all'],
    'storage': [], // Handled by Rua-specific API
    'http': ['fetch:all'],
    'shell': ['shell:execute', 'shell:open'],
    'fs': ['fs:read', 'fs:write'],
    'dialog': ['dialog:all'],
    'os': ['os:all'],
  };

  const tauriPermissions: AllPermission[] = [];
  for (const perm of ruaPermissions) {
    const mapped = permissionMap[perm];
    if (mapped) {
      tauriPermissions.push(...mapped);
    }
  }
  return tauriPermissions;
}

/**
 * Create the combined server API for extensions
 * Merges tauri-api-adapter APIs with Rua-specific APIs
 */
export function createExtensionServerAPI(
  extensionInfo: ExtensionHostInfo,
  callbacks: RuaHostCallbacks
) {
  // Map Rua permissions to tauri-api-adapter permissions
  const tauriPermissions = mapRuaPermissionsToTauriPermissions(extensionInfo.permissions);
  
  // Get tauri-api-adapter server API
  const tauriServerAPI = constructServerAPIWithPermissions(tauriPermissions);
  
  // Get Rua-specific API
  const ruaAPI = createRuaAPI(extensionInfo, callbacks);
  
  // Combine both APIs
  return {
    ...tauriServerAPI,
    ...ruaAPI,
  };
}

export type ExtensionServerAPI = ReturnType<typeof createExtensionServerAPI>;
