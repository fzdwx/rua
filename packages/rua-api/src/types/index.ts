/**
 * Type exports for rua-api
 */

// Manifest types
export type {
  PluginManifest,
  PluginPermission,
  ActionMode,
  ManifestAction,
  RuaConfig,
} from './manifest';

export {
  REQUIRED_MANIFEST_FIELDS,
  REQUIRED_RUA_FIELDS,
  VALID_PERMISSIONS,
  VALID_ACTION_MODES,
} from './manifest';

// Action types
export type {
  ActionContext,
  ViewProps,
  PluginAction,
  RegisteredAction,
  ManifestDerivedAction,
} from './action';

// API types
export type {
  NotificationOptions,
  ClipboardAPI,
  NotificationAPI,
  StorageAPI,
  EventHandler,
  PluginAPI,
  PluginModule,
} from './api';

// Registry types
export type {
  PluginInfo,
  PluginState,
  RegistryState,
  PluginRegistryEvent,
  PluginEventData,
  IPluginRegistry,
} from './registry';

export {
  REGISTRY_STATE_VERSION,
} from './registry';
