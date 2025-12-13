/**
 * Plugin Loader Implementation
 * 
 * Handles dynamic loading and unloading of plugins.
 * Based on Requirements 8.1, 8.2, 4.3
 */

import type { PluginManifest, ManifestAction } from '../types/manifest';
import type { PluginModule, PluginAPI } from '../types/api';
import type { ManifestDerivedAction } from '../types/action';

/**
 * Default timeout for plugin initialization (5 seconds)
 */
const DEFAULT_LOAD_TIMEOUT = 5000;

/**
 * Loaded plugin instance
 */
export interface LoadedPlugin {
  manifest: PluginManifest;
  module: PluginModule | null;
  actions: ManifestDerivedAction[];
  api: PluginAPI | null;
}

/**
 * Plugin load result
 */
export interface LoadResult {
  success: boolean;
  plugin?: LoadedPlugin;
  error?: Error;
  timedOut?: boolean;
}

/**
 * Plugin loader options
 */
export interface PluginLoaderOptions {
  /** Timeout for plugin initialization in ms */
  loadTimeout?: number;
  /** Function to create plugin API instance */
  createApi?: (pluginId: string, manifest: PluginManifest) => PluginAPI;
}

/**
 * Convert manifest actions to derived actions
 */
function convertManifestActions(
  manifest: PluginManifest,
  pluginPath: string
): ManifestDerivedAction[] {
  const uiEntry = manifest.rua.ui?.entry;
  
  return manifest.rua.actions.map((action: ManifestAction) => ({
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
 * Create a timeout promise
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Plugin initialization timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Plugin Loader
 * 
 * Manages loading and unloading of plugin modules.
 */
export class PluginLoader {
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private options: Required<PluginLoaderOptions>;

  constructor(options: PluginLoaderOptions = {}) {
    this.options = {
      loadTimeout: options.loadTimeout ?? DEFAULT_LOAD_TIMEOUT,
      createApi: options.createApi ?? (() => null as unknown as PluginAPI),
    };
  }

  /**
   * Load a plugin from its manifest and path
   * 
   * @param manifest - Plugin manifest
   * @param pluginPath - Path to plugin directory
   * @returns Load result
   */
  async load(manifest: PluginManifest, pluginPath: string): Promise<LoadResult> {
    const pluginId = manifest.id;

    // Check if already loaded
    if (this.loadedPlugins.has(pluginId)) {
      return {
        success: true,
        plugin: this.loadedPlugins.get(pluginId)!,
      };
    }

    try {
      // Convert manifest actions to derived actions
      const actions = convertManifestActions(manifest, pluginPath);

      // Create plugin API
      const api = this.options.createApi(pluginId, manifest);

      // Load init script if specified
      let module: PluginModule | null = null;
      
      if (manifest.rua.init) {
        const initPath = `${pluginPath}/${manifest.rua.init}`;
        
        try {
          // Dynamic import with timeout
          const importPromise = this.importModule(initPath);
          const timeoutPromise = createTimeout(this.options.loadTimeout);
          
          module = await Promise.race([importPromise, timeoutPromise]);
          
          // Call activate if module exports it
          if (module && typeof module.activate === 'function') {
            const activatePromise = Promise.resolve(module.activate(api));
            await Promise.race([activatePromise, timeoutPromise]);
          }
        } catch (e) {
          if (e instanceof Error && e.message.includes('timed out')) {
            console.warn(`Plugin ${pluginId} initialization timed out`);
            return {
              success: false,
              error: e,
              timedOut: true,
            };
          }
          throw e;
        }
      }

      const loadedPlugin: LoadedPlugin = {
        manifest,
        module,
        actions,
        api,
      };

      this.loadedPlugins.set(pluginId, loadedPlugin);

      return {
        success: true,
        plugin: loadedPlugin,
      };
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`Failed to load plugin ${pluginId}:`, error);
      
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Unload a plugin
   * 
   * @param pluginId - Plugin ID to unload
   */
  async unload(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) return;

    // Call deactivate if module exports it
    if (plugin.module && typeof plugin.module.deactivate === 'function') {
      try {
        await plugin.module.deactivate();
      } catch (e) {
        console.error(`Error deactivating plugin ${pluginId}:`, e);
      }
    }

    this.loadedPlugins.delete(pluginId);
  }

  /**
   * Get a loaded plugin
   */
  getLoaded(pluginId: string): LoadedPlugin | null {
    return this.loadedPlugins.get(pluginId) ?? null;
  }

  /**
   * Get all loaded plugins
   */
  getAllLoaded(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Check if a plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId);
  }

  /**
   * Load multiple plugins in parallel
   * 
   * @param plugins - Array of [manifest, path] tuples
   * @returns Array of load results
   */
  async loadAll(
    plugins: Array<{ manifest: PluginManifest; path: string }>
  ): Promise<LoadResult[]> {
    const results = await Promise.all(
      plugins.map(({ manifest, path }) => this.load(manifest, path))
    );
    return results;
  }

  /**
   * Import a module dynamically
   * This is a placeholder - actual implementation depends on runtime
   */
  private async importModule(path: string): Promise<PluginModule> {
    // In browser/Tauri context, this would use dynamic import
    // For now, throw an error indicating it needs runtime implementation
    console.log(`Importing module from: ${path}`);
    
    // Placeholder: in real implementation, use dynamic import
    // return await import(/* @vite-ignore */ path);
    
    return {
      activate: () => {
        console.log(`Plugin activated from ${path}`);
      },
    };
  }
}
