/**
 * Rua Extension Browser API
 * 
 * This module provides the browser-side API for extensions.
 * 
 * For iframe-based extensions (mode: "view" or "command"):
 *   Uses kkrpc for communication with the host application.
 *   const rua = await initializeRuaAPI()
 *   await rua.clipboard.readText()
 *   await rua.notification.show({ title: 'Hello' })
 *   await rua.storage.set('key', value)
 * 
 * For background scripts (mode: "background"):
 *   Runs directly in the main program context.
 *   const rua = createMainContextRuaAPI()
 *   await rua.storage.set('key', value)
 *   rua.on('activate', () => console.log('activated'))
 */

// Iframe-based API (for view and command modes)
export { initializeRuaAPI } from './rua-api';

// Main context API (for background mode)
export { createMainContextRuaAPI, getExtensionId } from './main-context-api';
export type { MainContextRuaAPI } from './main-context-api';

// Re-export types and enums
export type { 
  RuaAPI, 
  RuaClientAPI,
  ExtensionMeta, 
  DynamicAction,
} from './rua-api';

export { BaseDirectory } from './rua-api';
export type { FsOptions } from '../types';
