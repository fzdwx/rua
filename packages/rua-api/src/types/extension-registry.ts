/**
 * Extension Registry Types
 * 
 * Defines types for extension management and state tracking.
 * Based on Requirements 6.1, 6.3
 */

import type { ExtensionManifest } from './manifest';
import type { EventHandler } from './api';

/**
 * Extension information including runtime state
 */
export interface ExtensionInfo {
  /** Extension manifest data */
  manifest: ExtensionManifest;
  /** Whether extension is enabled */
  enabled: boolean;
  /** Whether extension module is currently loaded */
  loaded: boolean;
  /** Path to extension directory */
  path: string;
  /** IDs of actions registered by this extension */
  actions: string[];
  /** Error message if extension failed to load */
  error?: string;
}

/**
 * Persisted extension state (stored in registry.json)
 */
export interface ExtensionState {
  /** Extension ID */
  id: string;
  /** Whether extension is enabled */
  enabled: boolean;
  /** Installation timestamp (ISO 8601) */
  installedAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  /** Installed version */
  version: string;
  /** Extension-specific settings */
  settings?: Record<string, unknown>;
}

/**
 * Registry state file structure (registry.json)
 */
export interface RegistryState {
  /** Schema version for migrations */
  version: number;
  /** Map of extension ID to extension state */
  extensions: Record<string, ExtensionState>;
}

/**
 * Extension registry events
 */
export type ExtensionRegistryEvent =
  | 'extension:installed'
  | 'extension:uninstalled'
  | 'extension:enabled'
  | 'extension:disabled'
  | 'extension:loaded'
  | 'extension:unloaded'
  | 'extension:error'
  | 'ready';

/**
 * Event data for extension events
 */
export interface ExtensionEventData {
  /** Extension ID */
  extensionId: string;
  /** Extension info (if available) */
  extension?: ExtensionInfo;
  /** Error (for error events) */
  error?: Error;
}

/**
 * Extension Registry interface
 * 
 * Manages extension installation, loading, and lifecycle.
 */
export interface IExtensionRegistry {
  // Extension management
  /** Install an extension from a directory path */
  install(extensionPath: string): Promise<ExtensionInfo>;
  /** Uninstall an extension by ID */
  uninstall(extensionId: string): Promise<void>;
  /** Enable an extension */
  enable(extensionId: string): Promise<void>;
  /** Disable an extension */
  disable(extensionId: string): Promise<void>;

  // Query methods
  /** Get extension info by ID */
  getExtension(extensionId: string): ExtensionInfo | null;
  /** Get all installed extensions */
  getAllExtensions(): ExtensionInfo[];
  /** Get only enabled extensions */
  getEnabledExtensions(): ExtensionInfo[];

  // Event handling
  /** Subscribe to registry events */
  on(event: ExtensionRegistryEvent, handler: EventHandler<ExtensionEventData>): void;
  /** Unsubscribe from registry events */
  off(event: ExtensionRegistryEvent, handler: EventHandler<ExtensionEventData>): void;
}

/**
 * Current registry state version
 */
export const REGISTRY_STATE_VERSION = 1;