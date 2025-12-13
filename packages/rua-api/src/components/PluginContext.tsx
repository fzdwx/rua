/**
 * Plugin Context
 * 
 * Provides scoped context for plugin view components.
 * Based on Requirements 7.2
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { PluginAPI } from '../types/api';
import type { PluginManifest, PluginPermission } from '../types/manifest';

/**
 * Scoped plugin context value
 */
export interface PluginContextValue {
  /** Plugin ID */
  pluginId: string;
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Scoped API (only includes permitted APIs) */
  api: Partial<PluginAPI>;
  /** Current action name */
  actionName?: string;
  /** Close the plugin view */
  close: () => void;
}

/**
 * Plugin context
 */
const PluginContext = createContext<PluginContextValue | null>(null);

/**
 * Props for PluginProvider
 */
export interface PluginProviderProps {
  /** Plugin ID */
  pluginId: string;
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Full plugin API */
  api: PluginAPI;
  /** Current action name */
  actionName?: string;
  /** Close callback */
  onClose: () => void;
  /** Children */
  children: ReactNode;
}

/**
 * Create a scoped API based on permissions
 */
function createScopedAPI(
  api: PluginAPI,
  permissions: PluginPermission[]
): Partial<PluginAPI> {
  const scoped: Partial<PluginAPI> = {
    pluginId: api.pluginId,
    registerActions: api.registerActions.bind(api),
    unregisterActions: api.unregisterActions.bind(api),
    registerView: api.registerView.bind(api),
    on: api.on.bind(api),
    off: api.off.bind(api),
    emit: api.emit.bind(api),
  };

  // Only include permitted APIs
  if (permissions.includes('clipboard')) {
    scoped.clipboard = api.clipboard;
  }
  if (permissions.includes('notification')) {
    scoped.notification = api.notification;
  }
  if (permissions.includes('storage')) {
    scoped.storage = api.storage;
  }

  return scoped;
}

/**
 * Plugin context provider
 * 
 * Provides a scoped context to plugin view components.
 */
export function PluginProvider({
  pluginId,
  manifest,
  api,
  actionName,
  onClose,
  children,
}: PluginProviderProps) {
  const value = useMemo<PluginContextValue>(() => {
    const permissions = manifest.permissions ?? [];
    const scopedApi = createScopedAPI(api, permissions);

    return {
      pluginId,
      manifest,
      api: scopedApi,
      actionName,
      close: onClose,
    };
  }, [pluginId, manifest, api, actionName, onClose]);

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
}

/**
 * Hook to access plugin context
 * 
 * @throws Error if used outside of PluginProvider
 */
export function usePluginContext(): PluginContextValue {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePluginContext must be used within a PluginProvider');
  }
  return context;
}

/**
 * Hook to access plugin API
 * 
 * @throws Error if used outside of PluginProvider
 */
export function usePluginAPI(): Partial<PluginAPI> {
  const { api } = usePluginContext();
  return api;
}

/**
 * Hook to check if plugin has a specific permission
 */
export function usePluginPermission(permission: PluginPermission): boolean {
  const { manifest } = usePluginContext();
  return manifest.permissions?.includes(permission) ?? false;
}
