/**
 * Extension System Context
 *
 * Provides extension system access throughout the application.
 * Based on Requirements 8.1
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useFileWatcher, type FileChangeEvent } from '@/hooks/useFileWatcher';

// Import types from rua-api package
import type {
  ExtensionManifest,
  ExtensionInfo,
  ManifestDerivedAction,
  DynamicAction,
} from 'rua-api';

// Re-export for convenience
export type { ExtensionInfo, ManifestDerivedAction, DynamicAction };

/**
 * Extension system context value
 */
export interface ExtensionSystemContextValue {
  /** Whether the extension system is initialized */
  initialized: boolean;
  /** Whether extensions are currently loading */
  loading: boolean;
  /** All installed extensions */
  extensions: ExtensionInfo[];
  /** All actions from enabled extensions */
  extensionActions: ManifestDerivedAction[];
  /** Extensions directory path */
  extensionsPath: string | null;
  /** Development extension path (for live preview) */
  devExtensionPath: string | null;
  /** Set development extension path */
  setDevExtensionPath: (path: string | null) => void;
  /** Whether dev mode file watcher is active */
  devWatcherActive: boolean;
  /** Refresh key for dev mode hot reload - increments on file changes */
  devRefreshKey: number;
  /** Dynamic actions registered by extensions */
  dynamicActions: Map<string, DynamicAction[]>;
  /** Register dynamic actions for an extension */
  registerDynamicActions: (extensionId: string, actions: DynamicAction[]) => void;
  /** Unregister dynamic actions for an extension */
  unregisterDynamicActions: (extensionId: string, actionIds?: string[]) => void;
  /** Install an extension from path */
  installExtension: (path: string) => Promise<void>;
  /** Uninstall an extension */
  uninstallExtension: (extensionId: string) => Promise<void>;
  /** Enable an extension */
  enableExtension: (extensionId: string) => Promise<void>;
  /** Disable an extension */
  disableExtension: (extensionId: string) => Promise<void>;
  /** Reload all extensions */
  reloadExtensions: () => Promise<void>;
}

const ExtensionSystemContext = createContext<ExtensionSystemContextValue | null>(null);

/**
 * Props for PluginSystemProvider
 */
export interface PluginSystemProviderProps {
  children: ReactNode;
}

/**
 * Convert extension info to derived actions
 */
function convertExtensionToActions(ext: ExtensionInfo): ManifestDerivedAction[] {
  const { manifest, path: extPath } = ext;
  const uiEntry = manifest.rua.ui?.entry;

  console.log('[convertExtensionToActions] ext:', ext.manifest.id, 'path:', extPath, 'uiEntry:', uiEntry);

  return manifest.rua.actions.map((action) => {
    const derivedAction = {
      id: `${manifest.id}.${action.name}`,
      name: action.title,
      mode: action.mode,
      keywords: action.keywords?.join(' '),
      icon: action.icon,
      subtitle: action.subtitle,
      shortcut: action.shortcut,
      extensionId: manifest.id,
      actionName: action.name,
      uiEntry: action.mode === 'view' && uiEntry
        ? `${extPath}/${uiEntry}?action=${action.name}`
        : undefined,
      script: action.mode === 'command' && action.script
        ? `${extPath}/${action.script}`
        : undefined,
    };
    console.log('[convertExtensionToActions] action:', derivedAction.id, 'uiEntry:', derivedAction.uiEntry);
    return derivedAction;
  });
}

/**
 * Load dev extension from path
 */
async function loadDevExtension(devPath: string): Promise<ExtensionInfo | null> {
  try {
    const ext = await invoke<ExtensionInfo>('load_dev_extension', { devPath });
    return ext;
  } catch (error) {
    console.error('Failed to load dev extension:', error);
    return null;
  }
}

/**
 * Extension system provider component
 */
export function PluginSystemProvider({ children }: PluginSystemProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plugins, setPlugins] = useState<ExtensionInfo[]>([]);
  const [pluginActions, setPluginActions] = useState<ManifestDerivedAction[]>([]);
  const [extensionsPath, setExtensionsPath] = useState<string | null>(null);
  const [devExtensionPath, setDevExtensionPathState] = useState<string | null>(() => {
    // Restore from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rua:devExtensionPath');
    }
    return null;
  });

  // Dev mode hot reload state
  const [devRefreshKey, setDevRefreshKey] = useState(0);

  // Dynamic actions registered by extensions at runtime
  const [dynamicActions, setDynamicActions] = useState<Map<string, DynamicAction[]>>(new Map());

  // Track if we should start watching after initial load
  const shouldStartWatchingRef = useRef(false);

  // File change handler - increment refresh key to trigger hot reload
  const handleFileChange = useCallback((event: FileChangeEvent) => {
    console.log('[ExtensionSystemContext] File changed:', event.path);
    setDevRefreshKey(prev => prev + 1);
  }, []);

  // File watcher hook
  const { isWatching, startWatching, stopWatching } = useFileWatcher({
    onFileChange: handleFileChange,
  });

  // Load extensions from backend
  const loadExtensions = useCallback(async () => {
    try {
      setLoading(true);

      // Get extensions path
      const path = await invoke<string>('get_extensions_path');
      setExtensionsPath(path);

      // Get all installed extensions
      const extensions = await invoke<ExtensionInfo[]>('get_extensions');

      // Load dev extension if path is set
      let allExtensions = [...extensions];
      if (devExtensionPath) {
        const devExt = await loadDevExtension(devExtensionPath);
        if (devExt) {
          // Remove any existing extension with same ID
          allExtensions = allExtensions.filter(e => e.manifest.id !== devExt.manifest.id);
          // Add dev extension with a marker
          devExt.manifest.name = `[DEV] ${devExt.manifest.name}`;
          allExtensions.unshift(devExt);
        }
      }

      setPlugins(allExtensions);

      // Convert enabled extensions to actions
      const actions = allExtensions
        .filter(ext => ext.enabled && !ext.error)
        .flatMap(convertExtensionToActions);
      setPluginActions(actions);

      setInitialized(true);
    } catch (error) {
      console.error('Failed to load extensions:', error);
    } finally {
      setLoading(false);
    }
  }, [devExtensionPath]);

  // Set dev extension path and reload extensions
  const setDevExtensionPath = useCallback(async (path: string | null) => {
    // Stop watching the old path
    if (isWatching) {
      try {
        await stopWatching();
      } catch (error) {
        console.error('Failed to stop file watcher:', error);
      }
    }

    setDevExtensionPathState(path);
    if (path) {
      localStorage.setItem('rua:devExtensionPath', path);
      // Mark that we should start watching after extensions are loaded
      shouldStartWatchingRef.current = true;
    } else {
      localStorage.removeItem('rua:devExtensionPath');
      shouldStartWatchingRef.current = false;
    }
    // Note: loadExtensions will be called automatically via useEffect
    // because it depends on devExtensionPath
  }, [isWatching, stopWatching]);

  // Initialize extension system
  useEffect(() => {
    loadExtensions();
  }, [loadExtensions]);

  // Start/stop file watcher based on dev extension path
  useEffect(() => {
    // Only start watching after initial load is complete
    if (!initialized) return;

    const setupWatcher = async () => {
      if (devExtensionPath && shouldStartWatchingRef.current) {
        try {
          await startWatching(devExtensionPath);
          console.log('[ExtensionSystemContext] Started watching:', devExtensionPath);
          shouldStartWatchingRef.current = false;
        } catch (error) {
          console.error('Failed to start file watcher:', error);
        }
      }
    };

    setupWatcher();
  }, [initialized, devExtensionPath, startWatching]);

  // Start watching on initial load if dev path is set
  useEffect(() => {
    if (initialized && devExtensionPath && !isWatching) {
      startWatching(devExtensionPath).catch(error => {
        console.error('Failed to start file watcher on init:', error);
      });
    }
  }, [initialized, devExtensionPath, isWatching, startWatching]);

  // Install extension
  const installExtension = useCallback(async (path: string) => {
    try {
      await invoke('install_extension', { sourcePath: path });
      await loadExtensions();
    } catch (error) {
      console.error('Failed to install extension:', error);
      throw error;
    }
  }, [loadExtensions]);

  // Uninstall extension
  const uninstallExtension = useCallback(async (pluginId: string) => {
    try {
      // Clean up dynamic actions when extension is uninstalled
      setDynamicActions(prev => {
        const newMap = new Map(prev);
        newMap.delete(pluginId);
        return newMap;
      });
      await invoke('uninstall_extension', { extensionId: pluginId });
      await loadExtensions();
    } catch (error) {
      console.error('Failed to uninstall extension:', error);
      throw error;
    }
  }, [loadExtensions]);

  // Enable extension
  const enableExtension = useCallback(async (pluginId: string) => {
    try {
      await invoke('enable_extension', { extensionId: pluginId });
      await loadExtensions();
    } catch (error) {
      console.error('Failed to enable extension:', error);
      throw error;
    }
  }, [loadExtensions]);

  // Disable extension
  const disableExtension = useCallback(async (pluginId: string) => {
    try {
      // Clean up dynamic actions when extension is disabled
      setDynamicActions(prev => {
        const newMap = new Map(prev);
        newMap.delete(pluginId);
        return newMap;
      });
      await invoke('disable_extension', { extensionId: pluginId });
      await loadExtensions();
    } catch (error) {
      console.error('Failed to disable extension:', error);
      throw error;
    }
  }, [loadExtensions]);

  // Reload all extensions
  const reloadExtensions = useCallback(async () => {
    await loadExtensions();
  }, [loadExtensions]);

  // Register dynamic actions for an extension
  const registerDynamicActions = useCallback((extensionId: string, actions: DynamicAction[]) => {
    console.log('[ExtensionSystemContext] Registering dynamic actions for:', extensionId, actions);
    setDynamicActions(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(extensionId) || [];
      // Merge with existing, replacing duplicates by id
      const merged = [...existing];
      for (const action of actions) {
        const existingIndex = merged.findIndex(a => a.id === action.id);
        if (existingIndex >= 0) {
          merged[existingIndex] = action;
        } else {
          merged.push(action);
        }
      }
      newMap.set(extensionId, merged);
      return newMap;
    });
  }, []);

  // Unregister dynamic actions for an extension
  const unregisterDynamicActions = useCallback((extensionId: string, actionIds?: string[]) => {
    console.log('[ExtensionSystemContext] Unregistering dynamic actions for:', extensionId, actionIds);
    setDynamicActions(prev => {
      const newMap = new Map(prev);
      if (!actionIds) {
        // Remove all actions for this extension
        newMap.delete(extensionId);
      } else {
        // Remove specific actions
        const existing = newMap.get(extensionId) || [];
        const filtered = existing.filter(a => !actionIds.includes(a.id));
        if (filtered.length > 0) {
          newMap.set(extensionId, filtered);
        } else {
          newMap.delete(extensionId);
        }
      }
      return newMap;
    });
  }, []);

  const value: ExtensionSystemContextValue = {
    initialized,
    loading,
    extensions: plugins,
    extensionActions: pluginActions,
    extensionsPath,
    devExtensionPath,
    setDevExtensionPath,
    devWatcherActive: isWatching,
    devRefreshKey,
    dynamicActions,
    registerDynamicActions,
    unregisterDynamicActions,
    installExtension,
    uninstallExtension,
    enableExtension,
    disableExtension,
    reloadExtensions,
  };

  return (
    <ExtensionSystemContext.Provider value={value}>
      {children}
    </ExtensionSystemContext.Provider>
  );
}

/**
 * Hook to access extension system
 */
export function useExtensionSystem(): ExtensionSystemContextValue {
  const context = useContext(ExtensionSystemContext);
  if (!context) {
    throw new Error('useExtensionSystem must be used within a ExtensionSystemContext');
  }
  return context;
}
