/**
 * Extension API Types
 * 
 * Defines the API interface exposed to extensions.
 * Based on Requirements 5.1, 5.3
 */

import type { ComponentType } from 'react';
import type { ExtensionAction, ViewProps } from './action';

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
 * Data is namespaced per extension
 */
export interface StorageAPI {
  /** Get a value from storage */
  get<T>(key: string): Promise<T | null>;
  /** Set a value in storage */
  set<T>(key: string, value: T): Promise<void>;
  /** Remove a value from storage */
  remove(key: string): Promise<void>;
  /** List all keys in extension's namespace */
  keys(): Promise<string[]>;
  /** Clear all extension data */
  clear(): Promise<void>;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Main Extension API interface
 * 
 * This is the primary interface extensions use to interact with the host application.
 * API methods are permission-gated based on manifest declarations.
 */
export interface ExtensionAPI {
  /** Extension ID */
  readonly extensionId: string;

  // Action registration
  /** Register one or more actions */
  registerActions(actions: ExtensionAction[]): void;
  /** Unregister actions by their IDs (without extension prefix) */
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
 * Extension module interface
 * 
 * Extensions must export an activate function and optionally a deactivate function.
 */
export interface ExtensionModule {
  /** Called when extension is loaded */
  activate(api: ExtensionAPI): void | Promise<void>;
  /** Called when extension is unloaded (optional) */
  deactivate?(): void | Promise<void>;
}
