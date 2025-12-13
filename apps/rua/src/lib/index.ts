// Extension server API
export {
  createExtensionServerAPI,
  createRuaAPI,
  type ExtensionServerAPI,
  type RuaAPI,
} from './extension-server-api';

// Re-export shared types from rua-api
export type {
  RuaHostCallbacks,
  ExtensionHostInfo,
  DynamicAction,
  ExtensionMeta,
} from 'rua-api';
