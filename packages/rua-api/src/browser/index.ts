/**
 * Rua Extension Browser API
 * 
 * This module provides the browser-side API for extensions running in iframes.
 * Uses kkrpc for communication with the host application.
 * 
 * Usage:
 *   const rua = await initializeRuaAPI({ id, name, version })
 *   await rua.clipboard.readText()
 *   await rua.notification.show({ title: 'Hello' })
 *   await rua.storage.set('key', value)
 */

export { initializeRuaAPI } from './rua-api';

// Re-export types
export type { 
  RuaAPI, 
  RuaClientAPI,
  ExtensionMeta, 
  DynamicAction,
} from './rua-api';
