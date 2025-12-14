// Rua API Core - shared API implementations
export {
  apiCore,
  hasSimplePermission,
  permissionError,
  type FileStat,
  type DirEntry,
  type ShellResult,
} from './rua-api-core';

// Extension server API
export {
  createExtensionServerAPI,
  createRuaAPI,
  type ExtensionServerAPI,
  type RuaAPI,
} from './extension-server-api';

// Background script executor
export {
  executeBackgroundScript,
  notifyActivate as notifyBackgroundActivate,
  notifyDeactivate as notifyBackgroundDeactivate,
  notifyActionTriggered as notifyBackgroundActionTriggered,
  cleanupExtension as cleanupBackgroundExtension,
  setBackgroundCallbacks,
  getLoadedBackgroundExtensions,
  isBackgroundScriptLoaded,
  getBackgroundScriptState,
  createMainContextRuaAPI,
  type BackgroundScriptState,
  type BackgroundScriptCallbacks,
  type MainContextRuaAPI,
  type ActionTriggeredData,
} from './background-executor';

// Re-export shared types from rua-api
export type {
  RuaHostCallbacks,
  ExtensionHostInfo,
  DynamicAction,
  ExtensionMeta,
} from 'rua-api';
