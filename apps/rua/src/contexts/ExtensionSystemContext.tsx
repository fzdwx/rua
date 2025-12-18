/**
 * Extension System Context
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useFileWatcher, type FileChangeEvent } from "@/hooks/useFileWatcher";
import {
  executeBackgroundScript,
  setBackgroundCallbacks,
  notifyActivate as notifyActivateBackground,
  notifyDeactivate as notifyDeactivateBackground,
  notifySearchChange as notifySearchChangeBackground,
  cleanupExtension as cleanupBackgroundExtension,
  isBackgroundScriptLoaded,
} from "@/extension/background-executor.ts";

// Import types from rua-api package
import {
  ManifestAction,
  ManifestDerivedAction,
  DynamicAction,
  ExtensionManifest,
  ExtensionPermission,
  ParsedPermission,
} from "rua-api";

/**
 * Extension info from backend (includes runtime state)
 */
// Re-export for convenience
export type { ManifestDerivedAction, DynamicAction };

export interface ExtensionInfo {
  manifest: ExtensionManifest;
  enabled: boolean;
  loaded: boolean;
  path: string;
  actions: string[];
  error?: string;
}

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
  uninstallExtension: (extensionId: string, extensionPath?: string) => Promise<void>;
  /** Enable an extension */
  enableExtension: (extensionId: string) => Promise<void>;
  /** Disable an extension */
  disableExtension: (extensionId: string) => Promise<void>;
  /** Reload all extensions */
  reloadExtensions: () => Promise<void>;
  /** Notify all extensions that the main window is activated */
  notifyActivate: () => Promise<void>;
  /** Notify all extensions that the main window is deactivated */
  notifyDeactivate: () => Promise<void>;
  /** Notify all extensions that the search input value has changed */
  notifySearchChange: (query: string) => Promise<void>;
}

const ExtensionSystemContext = createContext<ExtensionSystemContextValue | null>(null);

/**
 * Props for PluginSystemProvider
 */
export interface ExtensionSystemProviderProps {
  children: ReactNode;
}

/**
 * Parse manifest permissions into simple strings and detailed parsed permissions
 */
function parseManifestPermissions(manifestPermissions: ExtensionPermission[]): {
  permissions: string[];
  parsedPermissions: ParsedPermission[];
} {
  const permissions: string[] = [];
  const parsedPermissions: ParsedPermission[] = [];

  for (const perm of manifestPermissions) {
    if (typeof perm === "string") {
      // Simple permission string
      permissions.push(perm);
      parsedPermissions.push({ permission: perm });
    } else {
      // Detailed permission with allow rules
      permissions.push(perm.permission);
      const parsed: ParsedPermission = { permission: perm.permission };

      if (perm.allow) {
        const allowPaths: string[] = [];
        const allowCommands: Array<{ program: string; args?: string[] }> = [];

        for (const rule of perm.allow) {
          if ("path" in rule) {
            allowPaths.push(rule.path);
          } else if ("cmd" in rule) {
            allowCommands.push({
              program: rule.cmd.program,
              args: rule.cmd.args,
            });
          }
        }

        if (allowPaths.length > 0) {
          parsed.allowPaths = allowPaths;
        }
        if (allowCommands.length > 0) {
          parsed.allowCommands = allowCommands;
        }
      }

      parsedPermissions.push(parsed);
    }
  }

  return { permissions, parsedPermissions };
}

/**
 * Convert extension info to derived actions
 * Filters out background actions as they are not user-facing
 */
function convertExtensionToActions(ext: ExtensionInfo): ManifestDerivedAction[] {
  const { manifest, path: extPath } = ext;
  const uiEntry = manifest.rua.ui?.entry;

  // Filter out background actions - they run automatically and shouldn't appear in action list
  const userFacingActions = manifest.rua.actions.filter(
    (action: ManifestAction) => action.mode !== "background"
  );

  return userFacingActions.map((action: ManifestAction) => {
    const derivedAction: ManifestDerivedAction = {
      id: `${manifest.id}.${action.name}`,
      name: action.title,
      mode: action.mode as "view",
      keywords: action.keywords?.join(" "),
      icon: action.icon,
      subtitle: action.subtitle,
      shortcut: action.shortcut,
      extensionId: manifest.id,
      actionName: action.name,
      uiEntry:
        action.mode === "view" && uiEntry
          ? `${extPath}/${uiEntry}?action=${action.name}`
          : undefined,
      query: action.query,
    };
    return derivedAction;
  });
}

/**
 * Load dev extension from path
 */
async function loadDevExtension(devPath: string): Promise<ExtensionInfo | null> {
  try {
    const ext = await invoke<ExtensionInfo>("load_dev_extension", { devPath });
    return ext;
  } catch (error) {
    throw error;
  }
}

/**
 * Extension system extension component
 */
export function ExtensionSystemProvider({ children }: ExtensionSystemProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plugins, setPlugins] = useState<ExtensionInfo[]>([]);
  const [pluginActions, setPluginActions] = useState<ManifestDerivedAction[]>([]);
  const [extensionsPath, setExtensionsPath] = useState<string | null>(null);
  const [devExtensionPath, setDevExtensionPathState] = useState<string | null>(() => {
    // Restore from localStorage
    if (typeof window !== "undefined") {
      return localStorage.getItem("rua:devExtensionPath");
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
    console.log("[ExtensionSystemContext] File changed:", event.path);
    setDevRefreshKey((prev) => prev + 1);
  }, []);

  // File watcher hook
  const { isWatching, startWatching, stopWatching } = useFileWatcher({
    onFileChange: handleFileChange,
  });

  // Register dynamic actions callback (called from init scripts)
  const registerDynamicActionsRef = useRef<
    ((extensionId: string, actions: DynamicAction[]) => void) | undefined
  >(undefined);
  const unregisterDynamicActionsRef = useRef<
    ((extensionId: string, actionIds: string[]) => void) | undefined
  >(undefined);

  // Track if loadExtensions is currently running to prevent duplicate calls
  const loadingRef = useRef(false);

  // Load extensions from backend
  const loadExtensions = useCallback(async () => {
    // Prevent duplicate calls
    if (loadingRef.current) {
      console.log("[ExtensionSystemContext] loadExtensions already running, skipping");
      return;
    }
    loadingRef.current = true;

    try {
      setLoading(true);

      // Get extensions path
      const path = await invoke<string>("get_extensions_path");
      setExtensionsPath(path);

      // Get all installed extensions
      const extensions = await invoke<ExtensionInfo[]>("get_extensions");

      // Load dev extension if path is set
      let allExtensions = [...extensions];
      if (devExtensionPath) {
        try {
          const devExt = await loadDevExtension(devExtensionPath);
          if (devExt) {
            // Remove any existing extension with same ID
            allExtensions = allExtensions.filter((e) => e.manifest.id !== devExt.manifest.id);
            // Add dev extension with a marker
            devExt.manifest.name = `[DEV] ${devExt.manifest.name}`;
            allExtensions.unshift(devExt);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          toast.error(`Failed to load dev extension: ${errorMessage}`);
          console.error("Failed to load dev extension:", error);
          // Clear the invalid dev path
          localStorage.removeItem("rua:devExtensionPath");
          setDevExtensionPathState(null);
        }
      }

      setPlugins(allExtensions);

      // Convert enabled extensions to actions
      const actions = allExtensions
        .filter((ext) => ext.enabled && !ext.error)
        .flatMap(convertExtensionToActions);
      setPluginActions(actions);

      // Execute background scripts for enabled extensions (only if not already loaded)
      for (const ext of allExtensions) {
        if (!ext.enabled || ext.error) continue;

        // Find background action (at most one per extension)
        const backgroundAction = ext.manifest.rua.actions.find(
          (action: ManifestAction) => action.mode === "background"
        );

        // Execute background script if present and not already loaded
        if (backgroundAction?.script) {
          // Skip if already loaded
          if (isBackgroundScriptLoaded(ext.manifest.id)) {
            console.log(
              "[ExtensionSystemContext] Background script already loaded for:",
              ext.manifest.id
            );
            continue;
          }

          console.log("[ExtensionSystemContext] Executing background script for:", ext.manifest.id);
          try {
            // Extract permissions from manifest
            const { permissions, parsedPermissions } = parseManifestPermissions(
              ext.manifest.permissions || []
            );

            await executeBackgroundScript(
              ext.manifest.id,
              ext.path,
              backgroundAction.script,
              ext.manifest.name,
              ext.manifest.version,
              permissions,
              parsedPermissions
            );
          } catch (error) {
            console.error(
              `[ExtensionSystemContext] Failed to execute background script for ${ext.manifest.id}:`,
              error
            );
          }
        }
      }

      setInitialized(true);

      // Notify all extensions that the window is activated on initial load
      // This ensures extensions receive the activate event even if the window
      // was already shown when they were loaded
      setTimeout(() => {
        notifyActivateBackground().catch((error) => {
          console.error("[ExtensionSystemContext] Failed to notify activate on init:", error);
        });
      }, 100);
    } catch (error) {
      console.error("Failed to load extensions:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [devExtensionPath]);

  // Set dev extension path and reload extensions
  const setDevExtensionPath = useCallback(
    async (path: string | null) => {
      // Stop watching the old path
      if (isWatching) {
        try {
          await stopWatching();
        } catch (error) {
          console.error("Failed to stop file watcher:", error);
        }
      }

      // If stopping dev mode, clean up the dev extension's background script
      // and uninstall the dev extension from extensions directory if it exists
      if (!path && devExtensionPath) {
        // Find the dev extension to get its ID for cleanup
        const devExt = plugins.find((p) => p.manifest.name.startsWith("[DEV]"));
        if (devExt) {
          cleanupBackgroundExtension(devExt.manifest.id);
          setDynamicActions((prev) => {
            const newMap = new Map(prev);
            newMap.delete(devExt.manifest.id);
            return newMap;
          });

          // Always try to uninstall the extension from extensions directory
          // This handles the case where the dev extension was installed or
          // there's a leftover directory from a previous installation
          if (extensionsPath) {
            try {
              await invoke("uninstall_extension", {
                extensionId: devExt.manifest.id,
                extensionPath: `${extensionsPath}/${devExt.manifest.id}`,
              });
              console.log(
                "[ExtensionSystemContext] Cleaned up dev extension from extensions directory:",
                devExt.manifest.id
              );
            } catch (error) {
              // Ignore errors - the directory might not exist
              console.log(
                "[ExtensionSystemContext] No installed copy to clean up for:",
                devExt.manifest.id
              );
            }
          }
        }
      }

      setDevExtensionPathState(path);
      if (path) {
        localStorage.setItem("rua:devExtensionPath", path);
        // Mark that we should start watching after extensions are loaded
        shouldStartWatchingRef.current = true;
      } else {
        localStorage.removeItem("rua:devExtensionPath");
        shouldStartWatchingRef.current = false;
      }
      // Note: loadExtensions will be called automatically via useEffect
      // because it depends on devExtensionPath
    },
    [isWatching, stopWatching, devExtensionPath, plugins, extensionsPath]
  );

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
          console.log("[ExtensionSystemContext] Started watching:", devExtensionPath);
          shouldStartWatchingRef.current = false;
        } catch (error) {
          console.error("Failed to start file watcher:", error);
        }
      }
    };

    setupWatcher();
  }, [initialized, devExtensionPath, startWatching]);

  // Start watching on initial load if dev path is set
  useEffect(() => {
    if (initialized && devExtensionPath && !isWatching) {
      startWatching(devExtensionPath).catch((error) => {
        console.error("Failed to start file watcher on init:", error);
      });
    }
  }, [initialized, devExtensionPath, isWatching, startWatching]);

  // Reload dev extension's background script when files change
  useEffect(() => {
    // Skip initial render (devRefreshKey starts at 0)
    if (devRefreshKey === 0 || !devExtensionPath || !initialized) return;

    const reloadDevBackgroundScript = async () => {
      // Find the dev extension
      const devExt = plugins.find((p) => p.manifest.name.startsWith("[DEV]"));
      if (!devExt) return;

      // Find background action
      const backgroundAction = devExt.manifest.rua.actions.find(
        (action: ManifestAction) => action.mode === "background"
      );

      if (!backgroundAction?.script) return;

      console.log(
        "[ExtensionSystemContext] Reloading dev background script for:",
        devExt.manifest.id
      );

      // Clean up existing background script
      cleanupBackgroundExtension(devExt.manifest.id);
      setDynamicActions((prev) => {
        const newMap = new Map(prev);
        newMap.delete(devExt.manifest.id);
        return newMap;
      });

      // Re-execute background script
      try {
        const { permissions, parsedPermissions } = parseManifestPermissions(
          devExt.manifest.permissions || []
        );

        await executeBackgroundScript(
          devExt.manifest.id,
          devExt.path,
          backgroundAction.script,
          devExt.manifest.name,
          devExt.manifest.version,
          permissions,
          parsedPermissions
        );
        console.log("[ExtensionSystemContext] Dev background script reloaded successfully");
      } catch (error) {
        console.error("[ExtensionSystemContext] Failed to reload dev background script:", error);
      }
    };

    reloadDevBackgroundScript();
  }, [devRefreshKey, devExtensionPath, initialized, plugins]);

  // Install extension
  const installExtension = useCallback(
    async (path: string) => {
      try {
        await invoke("install_extension", { sourcePath: path });
        await loadExtensions();
      } catch (error) {
        console.error("Failed to install extension:", error);
        throw error;
      }
    },
    [loadExtensions]
  );

  // Uninstall extension
  const uninstallExtension = useCallback(
    async (pluginId: string, pluginPath?: string) => {
      try {
        // Clean up dynamic actions and init state when extension is uninstalled
        setDynamicActions((prev) => {
          const newMap = new Map(prev);
          newMap.delete(pluginId);
          return newMap;
        });
        // Clean up background script state
        cleanupBackgroundExtension(pluginId);
        await invoke("uninstall_extension", { extensionId: pluginId, extensionPath: pluginPath });
        await loadExtensions();
      } catch (error) {
        console.error("Failed to uninstall extension:", error);
        throw error;
      }
    },
    [loadExtensions]
  );

  // Enable extension
  const enableExtension = useCallback(
    async (pluginId: string) => {
      try {
        await invoke("enable_extension", { extensionId: pluginId });
        await loadExtensions();
      } catch (error) {
        console.error("Failed to enable extension:", error);
        throw error;
      }
    },
    [loadExtensions]
  );

  // Disable extension
  const disableExtension = useCallback(
    async (pluginId: string) => {
      try {
        // Clean up dynamic actions and init state when extension is disabled
        setDynamicActions((prev) => {
          const newMap = new Map(prev);
          newMap.delete(pluginId);
          return newMap;
        });
        // Clean up background script state
        cleanupBackgroundExtension(pluginId);
        await invoke("disable_extension", { extensionId: pluginId });
        await loadExtensions();
      } catch (error) {
        console.error("Failed to disable extension:", error);
        throw error;
      }
    },
    [loadExtensions]
  );

  // Reload all extensions
  const reloadExtensions = useCallback(async () => {
    await loadExtensions();
  }, [loadExtensions]);

  // Register dynamic actions for an extension
  const registerDynamicActions = useCallback((extensionId: string, actions: DynamicAction[]) => {
    console.log("[ExtensionSystemContext] Registering dynamic actions for:", extensionId, actions);
    setDynamicActions((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(extensionId) || [];
      // Merge with existing, replacing duplicates by id
      const merged = [...existing];
      for (const action of actions) {
        const existingIndex = merged.findIndex((a) => a.id === action.id);
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
    console.log(
      "[ExtensionSystemContext] Unregistering dynamic actions for:",
      extensionId,
      actionIds
    );
    setDynamicActions((prev) => {
      const newMap = new Map(prev);
      if (!actionIds) {
        // Remove all actions for this extension
        newMap.delete(extensionId);
      } else {
        // Remove specific actions
        const existing = newMap.get(extensionId) || [];
        const filtered = existing.filter((a) => !actionIds.includes(a.id));
        if (filtered.length > 0) {
          newMap.set(extensionId, filtered);
        } else {
          newMap.delete(extensionId);
        }
      }
      return newMap;
    });
  }, []);

  // Set up action callbacks for background-executor
  useEffect(() => {
    registerDynamicActionsRef.current = registerDynamicActions;
    unregisterDynamicActionsRef.current = (extensionId: string, actionIds: string[]) => {
      unregisterDynamicActions(extensionId, actionIds);
    };
    // Set callbacks for background-executor (main context)
    setBackgroundCallbacks({
      onRegisterActions: (extId, actions) => registerDynamicActionsRef.current?.(extId, actions),
      onUnregisterActions: (extId, actionIds) =>
        unregisterDynamicActionsRef.current?.(extId, actionIds),
    });

    // Cleanup on unmount
    return () => {
      setBackgroundCallbacks(null);
    };
  }, [registerDynamicActions, unregisterDynamicActions]);

  // Notify functions that call background executor
  const notifyActivate = useCallback(async () => {
    await notifyActivateBackground();
  }, []);

  const notifyDeactivate = useCallback(async () => {
    await notifyDeactivateBackground();
  }, []);

  const notifySearchChange = useCallback(async (query: string) => {
    await notifySearchChangeBackground(query);
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
    notifyActivate,
    notifyDeactivate,
    notifySearchChange,
  };

  return (
    <ExtensionSystemContext.Provider value={value}>{children}</ExtensionSystemContext.Provider>
  );
}

/**
 * Hook to access extension system
 */
export function useExtensionSystem(): ExtensionSystemContextValue {
  const context = useContext(ExtensionSystemContext);
  if (!context) {
    throw new Error("useExtensionSystem must be used within a ExtensionSystemContext");
  }
  return context;
}
