/**
 * Type exports for rua-api
 */

// Manifest types
export type {
  ExtensionManifest,
  ExtensionPermission,
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
  ExtensionAction,
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
  ExtensionAPI,
  ExtensionModule,
} from './api';

// Registry types
export type {
  ExtensionInfo,
  ExtensionState,
  RegistryState,
  ExtensionRegistryEvent,
  ExtensionEventData,
  IExtensionRegistry,
} from './extension-registry';

export {
  REGISTRY_STATE_VERSION,
} from './extension-registry';

// Rua extension API types
export type {
  ExtensionMeta,
  DynamicAction,
  RuaClientAPI,
  RuaServerAPI,
  RuaHostCallbacks,
  ExtensionHostInfo,
} from './rua';
