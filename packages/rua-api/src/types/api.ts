/**
 * Plugin API Types
 * 
 * Defines the API interface exposed to plugins.
 * Based on Requirements 5.1, 5.3
 */

import type { ComponentType } from 'react';
import type { PluginAction, ViewProps } from './action';

/**
 * Notification options
 */
export interface NotificationOptions {
  /** Notification title */
  title: string;
  /** Notification body text */
  body?: string;
  /** Icon path or URL */
  icon?: string;
}

/**
 * Clipboard API
 * Requires 'clipboard' permission
 */
export interface ClipboardAPI {
  /** Read text from clipboard */
  read(): Promise<string>;
  /** Write text to clipboard */
  write(text: string): Promise<void>;
}

/**
 * Notification API
 * Requires 'notification' permission
 */
export interface NotificationAPI {
  /** Show a system notification */
  show(options: NotificationOptions): Promise<void>;
}

/**
 * Storage API
 * Requires 'storage' permission
 * Data is namespaced per plugin
 */
export interface StorageAPI {
  /** Get a value from storage */
  get<T>(key: string): Promise<T | null>;
  /** Set a value in storage */
  set<T>(key: string, value: T): Promise<void>;
  /** Remove a value from storage */
  remove(key: string): Promise<void>;
  /** List all keys in plugin's namespace */
  keys(): Promise<string[]>;
  /** Clear all plugin data */
  clear(): Promise<void>;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Main Plugin API interface
 * 
 * This is the primary interface plugins use to interact with the host application.
 * API methods are permission-gated based on manifest declarations.
 */
export interface PluginAPI {
  /** Plugin ID */
  readonly pluginId: string;

  // Action registration
  /** Register one or more actions */
  registerActions(actions: PluginAction[]): void;
  /** Unregister actions by their IDs (without plugin prefix) */
  unregisterActions(actionIds: string[]): void;

  // View registration
  /** Register a custom view component for an action */
  registerView(actionId: string, component: ComponentType<ViewProps>): void;

  // Utility APIs (permission-gated)
  /** Clipboard operations - requires 'clipboard' permission */
  clipboard: ClipboardAPI;
  /** Notification operations - requires 'notification' permission */
  notification: NotificationAPI;
  /** Storage operations - requires 'storage' permission */
  storage: StorageAPI;

  // Event system
  /** Subscribe to an event */
  on<T = unknown>(event: string, handler: EventHandler<T>): void;
  /** Unsubscribe from an event */
  off<T = unknown>(event: string, handler: EventHandler<T>): void;
  /** Emit an event */
  emit<T = unknown>(event: string, data?: T): void;
}

/**
 * Plugin module interface
 * 
 * Plugins must export an activate function and optionally a deactivate function.
 */
export interface PluginModule {
  /** Called when plugin is loaded */
  activate(api: PluginAPI): void | Promise<void>;
  /** Called when plugin is unloaded (optional) */
  deactivate?(): void | Promise<void>;
}
