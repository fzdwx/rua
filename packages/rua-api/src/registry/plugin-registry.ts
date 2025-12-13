/**
 * Plugin Registry Implementation
 * 
 * Manages plugin installation, loading, and lifecycle.
 * Based on Requirements 2.3, 6.1, 6.2, 6.3, 8.3
 */

import type {
  PluginInfo,
  RegistryState,
  PluginRegistryEvent,
  PluginEventData,
  IPluginRegistry,
} from '../types/registry';
import type { PluginManifest } from '../types/manifest';
import type { EventHandler } from '../types/api';
import { REGISTRY_STATE_VERSION } from '../types/registry';

/**
 * Event emitter for plugin registry
 */
class EventEmitter<T> {
  private listeners: Map<string, Set<EventHandler<T>>> = new Map();

  on(event: string, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, data: T): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (e) {
        console.error(`Error in event handler for ${event}:`, e);
      }
    });
  }
}

/**
 * Storage interface for registry persistence
 */
export interface RegistryStorage {
  /** Load registry state from storage */
  load(): Promise<RegistryState | null>;
  /** Save registry state to storage */
  save(state: RegistryState): Promise<void>;
  /** Get plugin directory path */
  getPluginDir(): string;
  /** Copy plugin files to store */
  copyPlugin(sourcePath: string, pluginId: string): Promise<string>;
  /** Remove plugin files from store */
  removePlugin(pluginId: string): Promise<void>;
  /** Read manifest from plugin directory */
  readManifest(pluginPath: string): Promise<PluginManifest>;
}

/**
 * Plugin Registry
 * 
 * Central manager for all plugin operations.
 */
export class PluginRegistry implements IPluginRegistry {
  private plugins: Map<string, PluginInfo> = new Map();
  private state: RegistryState;
  private emitter = new EventEmitter<PluginEventData>();
  private storage: RegistryStorage;
  private initialized = false;

  constructor(storage: RegistryStorage) {
    this.storage = storage;
    this.state = {
      version: REGISTRY_STATE_VERSION,
      plugins: {},
    };
  }

  /**
   * Initialize the registry
   * Loads persisted state and plugin info
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load persisted state
    const savedState = await this.storage.load();
    if (savedState) {
      this.state = savedState;
    }

    // Load plugin info for each registered plugin
    for (const [pluginId, pluginState] of Object.entries(this.state.plugins)) {
      try {
        const pluginPath = `${this.storage.getPluginDir()}/${pluginId}`;
        const manifest = await this.storage.readManifest(pluginPath);
        
        this.plugins.set(pluginId, {
          manifest,
          enabled: pluginState.enabled,
          loaded: false,
          path: pluginPath,
          actions: [],
        });
      } catch (e) {
        console.error(`Failed to load plugin ${pluginId}:`, e);
        this.plugins.set(pluginId, {
          manifest: {
            id: pluginId,
            name: pluginId,
            version: pluginState.version,
            rua: { engineVersion: '0.0.0', actions: [] },
          },
          enabled: false,
          loaded: false,
          path: '',
          actions: [],
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    this.initialized = true;
    this.emitter.emit('ready', { pluginId: '' });
  }

  /**
   * Install a plugin from a directory path
   */
  async install(pluginPath: string): Promise<PluginInfo> {
    // Read and validate manifest
    const manifest = await this.storage.readManifest(pluginPath);
    const pluginId = manifest.id;

    // Check for existing plugin
    const existing = this.plugins.get(pluginId);
    if (existing) {
      // For now, just update - in real implementation, prompt for confirmation
      console.log(`Updating existing plugin: ${pluginId}`);
    }

    // Copy plugin files to store
    const installedPath = await this.storage.copyPlugin(pluginPath, pluginId);

    // Create plugin info
    const pluginInfo: PluginInfo = {
      manifest,
      enabled: true, // Enable by default
      loaded: false,
      path: installedPath,
      actions: [],
    };

    // Update state
    const now = new Date().toISOString();
    this.state.plugins[pluginId] = {
      id: pluginId,
      enabled: true,
      installedAt: existing ? this.state.plugins[pluginId].installedAt : now,
      updatedAt: now,
      version: manifest.version,
    };

    this.plugins.set(pluginId, pluginInfo);
    await this.saveState();

    this.emitter.emit('plugin:installed', { pluginId, plugin: pluginInfo });
    return pluginInfo;
  }

  /**
   * Uninstall a plugin by ID
   */
  async uninstall(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Remove plugin files
    await this.storage.removePlugin(pluginId);

    // Update state
    delete this.state.plugins[pluginId];
    this.plugins.delete(pluginId);
    await this.saveState();

    this.emitter.emit('plugin:uninstalled', { pluginId });
  }

  /**
   * Enable a plugin
   */
  async enable(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (plugin.enabled) return;

    plugin.enabled = true;
    this.state.plugins[pluginId].enabled = true;
    await this.saveState();

    this.emitter.emit('plugin:enabled', { pluginId, plugin });
  }

  /**
   * Disable a plugin
   */
  async disable(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (!plugin.enabled) return;

    plugin.enabled = false;
    this.state.plugins[pluginId].enabled = false;
    await this.saveState();

    this.emitter.emit('plugin:disabled', { pluginId, plugin });
  }

  /**
   * Get plugin info by ID
   */
  getPlugin(pluginId: string): PluginInfo | null {
    return this.plugins.get(pluginId) ?? null;
  }

  /**
   * Get all installed plugins
   */
  getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get only enabled plugins
   */
  getEnabledPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  /**
   * Subscribe to registry events
   */
  on(event: PluginRegistryEvent, handler: EventHandler<PluginEventData>): void {
    this.emitter.on(event, handler);
  }

  /**
   * Unsubscribe from registry events
   */
  off(event: PluginRegistryEvent, handler: EventHandler<PluginEventData>): void {
    this.emitter.off(event, handler);
  }

  /**
   * Update plugin's loaded state and actions
   */
  setPluginLoaded(pluginId: string, loaded: boolean, actions: string[] = []): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.loaded = loaded;
      plugin.actions = actions;
      
      if (loaded) {
        this.emitter.emit('plugin:loaded', { pluginId, plugin });
      } else {
        this.emitter.emit('plugin:unloaded', { pluginId, plugin });
      }
    }
  }

  /**
   * Set plugin error state
   */
  setPluginError(pluginId: string, error: Error): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.error = error.message;
      plugin.loaded = false;
      this.emitter.emit('plugin:error', { pluginId, plugin, error });
    }
  }

  /**
   * Save state to storage
   */
  private async saveState(): Promise<void> {
    await this.storage.save(this.state);
  }
}
