/**
 * Rua Extension Browser API
 * 
 * This module provides the browser-side API for extensions running in iframes.
 * Uses tauri-api-adapter for Tauri API access and kkrpc for communication.
 */

export { 
  initializeRuaAPI, 
  type RuaAPI, 
  type ExtensionMeta, 
  type DynamicAction,
  // Rename to avoid conflict with types/api.ts
  type NotificationOptions as RuaNotificationOptions,
} from './rua-api';

// Re-export tauri-api-adapter iframe APIs for convenience
export { clipboard, dialog, fetch, fs, notification, os, shell, sysInfo, network } from 'tauri-api-adapter/iframe';
