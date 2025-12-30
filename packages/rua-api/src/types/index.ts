/**
 * Type exports for rua-api
 */

// Manifest types
export type {
  ExtensionManifest,
  ExtensionPermission,
  SimplePermission,
  DetailedPermission,
  PathPermissionRule,
  ShellCommandRule,
  ActionMode,
  ManifestAction,
  RuaConfig,
  PreferenceType,
  PreferenceOption,
  TextfieldPreference,
  DropdownPreference,
  TogglePreference,
  ShortcutPreference,
  PathListPreference,
  PreferenceField,
} from "./manifest";

// Rua extension API types
export type {
  CurrentActionInfo,
  ExtensionMeta,
  EventHandler,
  DynamicAction,
  RuaClientAPI,
  RuaServerAPI,
  RuaHostCallbacks,
  RuaClientCallbacks,
  ExtensionHostInfo,
  ManifestDerivedAction,
  FileStat,
  DirEntry,
  ShellResult,
  ParsedPermission,
  FsOptions,
  ActionTriggeredData,
  SearchChangeData,
  BackgroundScriptState,
  BackgroundScriptCallbacks,
} from "./rua";

export { BaseDirectory } from "./rua";

export type { FileSearchConfig } from "./file-search";
export { DEFAULT_FILE_SEARCH_CONFIG } from "./file-search";
