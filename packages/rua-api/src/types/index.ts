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
} from './manifest';

// Rua extension API types
export type {
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
} from './rua';

export { BaseDirectory } from './rua';
