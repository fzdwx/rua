// Legacy API bridge (kept for compatibility)
export * from './api-bridge';

// Extension server API (tauri-api-adapter + Rua-specific)
export {
  createExtensionServerAPI,
  createRuaAPI,
  mapRuaPermissionsToTauriPermissions,
  type ExtensionServerAPI,
  type RuaAPI,
  type RuaHostCallbacks,
  type ExtensionHostInfo,
  type DynamicAction,
  type ExtensionMeta,
  type NotificationOptions,
} from './extension-server-api';
