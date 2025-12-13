/**
 * Plugin System Context
 * 
 * Provides plugin system access throughout the application.
 * Based on Requirements 8.1
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
// Types will be imported from rua-api once workspace is properly linked
// import type { PluginInfo, PluginManifest } from 'rua-api';

// Temporary type definitions
interface PluginInfo {
  manifest: {
    id: string;
    name: string;
    version: string;
    rua: {
      engineVersion: string;
      ui?: { entry: string };
      init?: string;
      actions: Array<{
        name: string;
        title: string;
        mode: 'view' | 'command';
        keywords?: string[];
        icon?: string;
        subtitle?: string;
        shortcut?: string[];
        script?: string;
      }>;
    };
    description?: string;
    author?: string;
    permissions?: string[];
  };
  enabled: boolean;
  loaded: boolean;
  path: string;
  actions: string[];
  error?: string;
}

/**
 * Action derived from plugin manifest
 */
export interface ManifestDerivedAction {
  id: string;
  name: string;
  mode: 'view' | 'command';
  keywords?: string;
  icon?: string;
  subtitle?: string;
  shortcut?: string[];
  pluginId: string;
  actionName: string;
  uiEntry?: string;
  script?: string;
}

/**
 * Plugin system context value
 */
export interface PluginSystemContextValue {
  /** Whether the plugin system is initialized */
  initialized: boolean;
  /** Whether plugins are currently loading */
  loading: boolean;
  /** All installed plugins */
  plugins: PluginInfo[];
  /** All actions from enabled plugins */
  pluginActions: ManifestDerivedAction[];
  /** Install a plugin from path */
  installPlugin: (path: string) => Promise<void>;
  /** Uninstall a plugin */
  uninstallPlugin: (pluginId: string) => Promise<void>;
  /** Enable a plugin */
  enablePlugin: (pluginId: string) => Promise<void>;
  /** Disable a plugin */
  disablePlugin: (pluginId: string) => Promise<void>;
  /** Reload all plugins */
  reloadPlugins: () => Promise<void>;
}

const PluginSystemContext = createContext<PluginSystemContextValue | null>(null);

/**
 * Props for PluginSystemProvider
 */
export interface PluginSystemProviderProps {
  children: ReactNode;
}

/**
 * Convert plugin info to derived actions
 * @internal Used when loading plugins
 */
export function convertPluginToActions(plugin: PluginInfo): ManifestDerivedAction[] {
  const { manifest, path: pluginPath } = plugin;
  const uiEntry = manifest.rua.ui?.entry;
  
  return manifest.rua.actions.map((action) => ({
    id: `${manifest.id}.${action.name}`,
    name: action.title,
    mode: action.mode,
    keywords: action.keywords?.join(' '),
    icon: action.icon,
    subtitle: action.subtitle,
    shortcut: action.shortcut,
    pluginId: manifest.id,
    actionName: action.name,
    uiEntry: action.mode === 'view' && uiEntry 
      ? `${pluginPath}/${uiEntry}?action=${action.name}`
      : undefined,
    script: action.mode === 'command' && action.script
      ? `${pluginPath}/${action.script}`
      : undefined,
  }));
}

/**
 * Plugin system provider component
 * 
 * This is a simplified implementation for development.
 * Full implementation will use PluginRegistry and PluginLoader from rua-api.
 */
export function PluginSystemProvider({ children }: PluginSystemProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plugins] = useState<PluginInfo[]>([]);
  const [pluginActions] = useState<ManifestDerivedAction[]>([]);

  // Initialize plugin system
  useEffect(() => {
    const init = async () => {
      try {
        // TODO: Initialize PluginRegistry and PluginLoader
        // For now, just mark as initialized with empty plugins
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize plugin system:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Install plugin (placeholder)
  const installPlugin = useCallback(async (_path: string) => {
    console.log('installPlugin not yet implemented');
    // TODO: Implement with PluginRegistry
  }, []);

  // Uninstall plugin (placeholder)
  const uninstallPlugin = useCallback(async (_pluginId: string) => {
    console.log('uninstallPlugin not yet implemented');
    // TODO: Implement with PluginRegistry
  }, []);

  // Enable plugin (placeholder)
  const enablePlugin = useCallback(async (_pluginId: string) => {
    console.log('enablePlugin not yet implemented');
    // TODO: Implement with PluginRegistry
  }, []);

  // Disable plugin (placeholder)
  const disablePlugin = useCallback(async (_pluginId: string) => {
    console.log('disablePlugin not yet implemented');
    // TODO: Implement with PluginRegistry
  }, []);

  // Reload all plugins (placeholder)
  const reloadPlugins = useCallback(async () => {
    console.log('reloadPlugins not yet implemented');
    // TODO: Implement with PluginRegistry and PluginLoader
  }, []);

  const value: PluginSystemContextValue = {
    initialized,
    loading,
    plugins,
    pluginActions,
    installPlugin,
    uninstallPlugin,
    enablePlugin,
    disablePlugin,
    reloadPlugins,
  };

  return (
    <PluginSystemContext.Provider value={value}>
      {children}
    </PluginSystemContext.Provider>
  );
}

/**
 * Hook to access plugin system
 */
export function usePluginSystem(): PluginSystemContextValue {
  const context = useContext(PluginSystemContext);
  if (!context) {
    throw new Error('usePluginSystem must be used within a PluginSystemProvider');
  }
  return context;
}

/**
 * Hook to get plugin actions
 */
export function usePluginActions(): ManifestDerivedAction[] {
  const { pluginActions } = usePluginSystem();
  return pluginActions;
}
