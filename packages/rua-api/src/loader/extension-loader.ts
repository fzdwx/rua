/**
 * Extension Loader Implementation
 * 
 * Handles dynamic loading and unloading of extensions.
 * Based on Requirements 8.1, 8.2, 4.3
 */

import type { ExtensionManifest, ManifestAction } from '../types/manifest';
import type { ExtensionModule, ExtensionAPI } from '../types/api';
import type { ManifestDerivedAction } from '../types/action';

/**
 * Default timeout for extension initialization (5 seconds)
 */
const DEFAULT_LOAD_TIMEOUT = 5000;

/**
 * Loaded extension instance
 */
export interface LoadedExtension {
  manifest: ExtensionManifest;
  module: ExtensionModule | null;
  actions: ManifestDerivedAction[];
  api: ExtensionAPI | null;
}

/**
 * Extension load result
 */
export interface LoadResult {
  success: boolean;
  extension?: LoadedExtension;
  error?: Error;
  timedOut?: boolean;
}

/**
 * Extension loader options
 */
export interface ExtensionLoaderOptions {
  /** Timeout for extension initialization in ms */
  loadTimeout?: number;
  /** Function to create extension API instance */
  createApi?: (extensionId: string, manifest: ExtensionManifest) => ExtensionAPI;
}

/**
 * Convert manifest actions to derived actions
 */
function convertManifestActions(
  manifest: ExtensionManifest,
  extensionPath: string
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
    extensionId: manifest.id,
    actionName: action.name,
    uiEntry: action.mode === 'view' && uiEntry 
      ? `${extensionPath}/${uiEntry}?action=${action.name}`
      : undefined,
    script: action.mode === 'command' && action.script
      ? `${extensionPath}/${action.script}`
      : undefined,
  }));
}

/**
 * Create a timeout promise
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Extension initialization timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Extension Loader
 * 
 * Manages loading and unloading of extension modules.
 */
export class ExtensionLoader {
  private loadedExtensions: Map<string, LoadedExtension> = new Map();
  private options: Required<ExtensionLoaderOptions>;

  constructor(options: ExtensionLoaderOptions = {}) {
    this.options = {
      loadTimeout: options.loadTimeout ?? DEFAULT_LOAD_TIMEOUT,
      createApi: options.createApi ?? (() => null as unknown as ExtensionAPI),
    };
  }

  /**
   * Load an extension from its manifest and path
   * 
   * @param manifest - Extension manifest
   * @param extensionPath - Path to extension directory
   * @returns Load result
   */
  async load(manifest: ExtensionManifest, extensionPath: string): Promise<LoadResult> {
    const extensionId = manifest.id;

    // Check if already loaded
    if (this.loadedExtensions.has(extensionId)) {
      return {
        success: true,
        extension: this.loadedExtensions.get(extensionId)!,
      };
    }

    try {
      // Convert manifest actions to derived actions
      const actions = convertManifestActions(manifest, extensionPath);

      // Create extension API
      const api = this.options.createApi(extensionId, manifest);

      // Load init script if specified
      let module: ExtensionModule | null = null;
      
      if (manifest.rua.init) {
        const initPath = `${extensionPath}/${manifest.rua.init}`;
        
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
            console.warn(`Extension ${extensionId} initialization timed out`);
            return {
              success: false,
              error: e,
              timedOut: true,
            };
          }
          throw e;
        }
      }

      const loadedExtension: LoadedExtension = {
        manifest,
        module,
        actions,
        api,
      };

      this.loadedExtensions.set(extensionId, loadedExtension);

      return {
        success: true,
        extension: loadedExtension,
      };
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`Failed to load extension ${extensionId}:`, error);
      
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Unload an extension
   * 
   * @param extensionId - Extension ID to unload
   */
  async unload(extensionId: string): Promise<void> {
    const extension = this.loadedExtensions.get(extensionId);
    if (!extension) return;

    // Call deactivate if module exports it
    if (extension.module && typeof extension.module.deactivate === 'function') {
      try {
        await extension.module.deactivate();
      } catch (e) {
        console.error(`Error deactivating extension ${extensionId}:`, e);
      }
    }

    this.loadedExtensions.delete(extensionId);
  }

  /**
   * Get a loaded extension
   */
  getLoaded(extensionId: string): LoadedExtension | null {
    return this.loadedExtensions.get(extensionId) ?? null;
  }

  /**
   * Get all loaded extensions
   */
  getAllLoaded(): LoadedExtension[] {
    return Array.from(this.loadedExtensions.values());
  }

  /**
   * Check if an extension is loaded
   */
  isLoaded(extensionId: string): boolean {
    return this.loadedExtensions.has(extensionId);
  }

  /**
   * Load multiple extensions in parallel
   * 
   * @param extensions - Array of [manifest, path] tuples
   * @returns Array of load results
   */
  async loadAll(
    extensions: Array<{ manifest: ExtensionManifest; path: string }>
  ): Promise<LoadResult[]> {
    const results = await Promise.all(
      extensions.map(({ manifest, path }) => this.load(manifest, path))
    );
    return results;
  }

  /**
   * Import a module dynamically
   * This is a placeholder - actual implementation depends on runtime
   */
  private async importModule(path: string): Promise<ExtensionModule> {
    // In browser/Tauri context, this would use dynamic import
    // For now, throw an error indicating it needs runtime implementation
    console.log(`Importing module from: ${path}`);
    
    // Placeholder: in real implementation, use dynamic import
    // return await import(/* @vite-ignore */ path);
    
    return {
      activate: () => {
        console.log(`Extension activated from ${path}`);
      },
    };
  }
}