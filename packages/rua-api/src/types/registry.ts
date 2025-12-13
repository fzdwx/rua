/**
 * Plugin Registry Types
 * 
 * Defines types for plugin management and state tracking.
 * Based on Requirements 6.1, 6.3
 */

import type { PluginManifest } from './manifest';
import type { EventHandler } from './api';

/**
 * Plugin information including runtime state
 */
export interface PluginInfo {
  /** Plugin manifest data */
  manifest: PluginManifest;
  /** Whether plugin is enabled */
  enabled: boolean;
  /** Whether plugin module is currently loaded */
  loaded: boolean;
  /** Path to plugin directory */
  path: string;
  /** IDs of actions registered by this plugin */
  actions: string[];
  /** Error message if plugin failed to load */
  error?: string;
}

/**
 * Persisted plugin state (stored in registry.json)
 */
export interface PluginState {
  /** Plugin ID */
  id: string;
  /** Whether plugin is enabled */
  enabled: boolean;
  /** Installation timestamp (ISO 8601) */
  installedAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  /** Installed version */
  version: string;
  /** Plugin-specific settings */
  settings?: Record<string, unknown>;
}

/**
 * Registry state file structure (registry.json)
 */
export interface RegistryState {
  /** Schema version for migrations */
  version: number;
  /** Map of plugin ID to plugin state */
  plugins: Record<string, PluginState>;
}

/**
 * Plugin registry events
 */
export type PluginRegistryEvent =
  | 'plugin:installed'
  | 'plugin:uninstalled'
  | 'plugin:enabled'
  | 'plugin:disabled'
  | 'plugin:loaded'
  | 'plugin:unloaded'
  | 'plugin:error'
  | 'ready';

/**
 * Event data for plugin events
 */
export interface PluginEventData {
  /** Plugin ID */
  pluginId: string;
  /** Plugin info (if available) */
  plugin?: PluginInfo;
  /** Error (for error events) */
  error?: Error;
}

/**
 * Plugin Registry interface
 * 
 * Manages plugin installation, loading, and lifecycle.
 */
export interface IPluginRegistry {
  // Plugin management
  /** Install a plugin from a directory path */
  install(pluginPath: string): Promise<PluginInfo>;
  /** Uninstall a plugin by ID */
  uninstall(pluginId: string): Promise<void>;
  /** Enable a plugin */
  enable(pluginId: string): Promise<void>;
  /** Disable a plugin */
  disable(pluginId: string): Promise<void>;

  // Query methods
  /** Get plugin info by ID */
  getPlugin(pluginId: string): PluginInfo | null;
  /** Get all installed plugins */
  getAllPlugins(): PluginInfo[];
  /** Get only enabled plugins */
  getEnabledPlugins(): PluginInfo[];

  // Event handling
  /** Subscribe to registry events */
  on(event: PluginRegistryEvent, handler: EventHandler<PluginEventData>): void;
  /** Unsubscribe from registry events */
  off(event: PluginRegistryEvent, handler: EventHandler<PluginEventData>): void;
}

/**
 * Current registry state version
 */
export const REGISTRY_STATE_VERSION = 1;
