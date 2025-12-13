/**
 * Extension Registry Implementation
 *
 * Manages extension installation, loading, and lifecycle.
 * Based on Requirements 2.3, 6.1, 6.2, 6.3, 8.3
 */

import type {
  ExtensionInfo,
  RegistryState,
  ExtensionRegistryEvent,
  ExtensionEventData,
  IExtensionRegistry,
} from '../types/extension-registry';
import type { EventHandler } from '../types/api';
import { REGISTRY_STATE_VERSION } from '../types/extension-registry';
import { ExtensionManifest } from "../types";

/**
 * Event emitter for extension registry
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
  /** Get extension directory path */
  getExtensionDir(): string;
  /** Copy extension files to store */
  copyExtension(sourcePath: string, extensionId: string): Promise<string>;
  /** Remove extension files from store */
  removeExtension(extensionId: string): Promise<void>;
  /** Read manifest from extension directory */
  readManifest(extensionPath: string): Promise<ExtensionManifest>;
}

/**
 * Extension Registry
 *
 * Central manager for all extension operations.
 */
export class ExtensionRegistry implements IExtensionRegistry {
  private extensions: Map<string, ExtensionInfo> = new Map();
  private state: RegistryState;
  private emitter = new EventEmitter<ExtensionEventData>();
  private storage: RegistryStorage;
  private initialized = false;

  constructor(storage: RegistryStorage) {
    this.storage = storage;
    this.state = {
      version: REGISTRY_STATE_VERSION,
      extensions: {},
    };
  }

  /**
   * Initialize the registry
   * Loads persisted state and extension info
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load persisted state
    const savedState = await this.storage.load();
    if (savedState) {
      this.state = savedState;
    }

    // Load extension info for each registered extension
    for (const [extensionId, extensionState] of Object.entries(this.state.extensions)) {
      try {
        const extensionPath = `${this.storage.getExtensionDir()}/${extensionId}`;
        const manifest = await this.storage.readManifest(extensionPath);

        this.extensions.set(extensionId, {
          manifest,
          enabled: extensionState.enabled,
          loaded: false,
          path: extensionPath,
          actions: [],
        });
      } catch (e) {
        console.error(`Failed to load extension ${extensionId}:`, e);
        this.extensions.set(extensionId, {
          manifest: {
            id: extensionId,
            name: extensionId,
            version: extensionState.version,
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
    this.emitter.emit('ready', { extensionId: '' });
  }

  /**
   * Install an extension from a directory path
   */
  async install(extensionPath: string): Promise<ExtensionInfo> {
    // Read and validate manifest
    const manifest = await this.storage.readManifest(extensionPath);
    const extensionId = manifest.id;

    // Check for existing extension
    const existing = this.extensions.get(extensionId);
    if (existing) {
      // For now, just update - in real implementation, prompt for confirmation
      console.log(`Updating existing extension: ${extensionId}`);
    }

    // Copy extension files to store
    const installedPath = await this.storage.copyExtension(extensionPath, extensionId);

    // Create extension info
    const extensionInfo: ExtensionInfo = {
      manifest,
      enabled: true, // Enable by default
      loaded: false,
      path: installedPath,
      actions: [],
    };

    // Update state
    const now = new Date().toISOString();
    this.state.extensions[extensionId] = {
      id: extensionId,
      enabled: true,
      installedAt: existing ? this.state.extensions[extensionId].installedAt : now,
      updatedAt: now,
      version: manifest.version,
    };

    this.extensions.set(extensionId, extensionInfo);
    await this.saveState();

    this.emitter.emit('extension:installed', { extensionId: extensionId, extension: extensionInfo });
    return extensionInfo;
  }

  /**
   * Uninstall an extension by ID
   */
  async uninstall(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    // Remove extension files
    await this.storage.removeExtension(extensionId);

    // Update state
    delete this.state.extensions[extensionId];
    this.extensions.delete(extensionId);
    await this.saveState();

    this.emitter.emit('extension:uninstalled', { extensionId: extensionId });
  }

  /**
   * Enable an extension
   */
  async enable(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    if (extension.enabled) return;

    extension.enabled = true;
    this.state.extensions[extensionId].enabled = true;
    await this.saveState();

    this.emitter.emit('extension:enabled', { extensionId: extensionId, extension });
  }

  /**
   * Disable an extension
   */
  async disable(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    if (!extension.enabled) return;

    extension.enabled = false;
    this.state.extensions[extensionId].enabled = false;
    await this.saveState();

    this.emitter.emit('extension:disabled', { extensionId: extensionId, extension });
  }

  /**
   * Get extension info by ID
   */
  getExtension(extensionId: string): ExtensionInfo | null {
    return this.extensions.get(extensionId) ?? null;
  }

  /**
   * Get all installed extensions
   */
  getAllExtensions(): ExtensionInfo[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get only enabled extensions
   */
  getEnabledExtensions(): ExtensionInfo[] {
    return Array.from(this.extensions.values()).filter(e => e.enabled);
  }

  /**
   * Subscribe to registry events
   */
  on(event: ExtensionRegistryEvent, handler: EventHandler<ExtensionEventData>): void {
    this.emitter.on(event, handler);
  }

  /**
   * Unsubscribe from registry events
   */
  off(event: ExtensionRegistryEvent, handler: EventHandler<ExtensionEventData>): void {
    this.emitter.off(event, handler);
  }

  /**
   * Update extension's loaded state and actions
   */
  setExtensionLoaded(extensionId: string, loaded: boolean, actions: string[] = []): void {
    const extension = this.extensions.get(extensionId);
    if (extension) {
      extension.loaded = loaded;
      extension.actions = actions;

      if (loaded) {
        this.emitter.emit('extension:loaded', { extensionId: extensionId, extension });
      } else {
        this.emitter.emit('extension:unloaded', { extensionId: extensionId, extension });
      }
    }
  }

  /**
   * Set extension error state
   */
  setExtensionError(extensionId: string, error: Error): void {
    const extension = this.extensions.get(extensionId);
    if (extension) {
      extension.error = error.message;
      extension.loaded = false;
      this.emitter.emit('extension:error', { extensionId: extensionId, extension, error });
    }
  }

  /**
   * Save state to storage
   */
  private async saveState(): Promise<void> {
    await this.storage.save(this.state);
  }
}