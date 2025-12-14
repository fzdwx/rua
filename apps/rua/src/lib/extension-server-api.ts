/**
 * Extension Server API
 *
 * Rua-specific APIs exposed to extension iframes via kkrpc.
 */

import { invoke } from '@tauri-apps/api/core';
import type {
    ExtensionMeta,
    DynamicAction,
    RuaServerAPI,
    RuaHostCallbacks,
    ExtensionHostInfo,
    ParsedPermission
} from 'rua-api';

// Re-export types for convenience
export type { ExtensionMeta, DynamicAction, RuaHostCallbacks, RuaClientCallbacks, ExtensionHostInfo } from 'rua-api';

/** Alias for RuaServerAPI */
export type RuaAPI = RuaServerAPI;

/**
 * Check if extension has a specific permission
 */
function hasPermission(extensionInfo: ExtensionHostInfo, permission: string): boolean {
    return extensionInfo.permissions.includes(permission);
}

/**
 * Expand environment variables in path
 */
function expandPath(path: string): string {
    const home = typeof process !== 'undefined' ? process.env.HOME : '';
    const appData = typeof process !== 'undefined' ? process.env.APPDATA : '';

    return path
        .replace(/\$HOME/g, home || '')
        .replace(/\$APPDATA/g, appData || '');
}

/**
 * Check if a path matches a pattern
 * Supports ** for any path, * for single segment
 */
function pathMatches(path: string, pattern: string): boolean {
    const expandedPattern = expandPath(pattern);

    // Convert glob pattern to regex
    const regexPattern = expandedPattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Escape special chars except * and ?
        .replace(/\*\*/g, '<<<GLOBSTAR>>>')     // Temp placeholder for **
        .replace(/\*/g, '[^/]*')                // * matches anything except /
        .replace(/<<<GLOBSTAR>>>/g, '.*');      // ** matches anything

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
}

/**
 * Check if extension has permission for a specific path
 */
function hasPathPermission(extensionInfo: ExtensionHostInfo, permission: string, path: string): boolean {
    // First check simple permission
    if (!hasPermission(extensionInfo, permission)) {
        return false;
    }

    // If no parsed permissions, allow all (backward compatibility)
    const parsedPermissions = (extensionInfo as ExtensionHostInfo & { parsedPermissions?: ParsedPermission[] }).parsedPermissions;
    if (!parsedPermissions) {
        return true;
    }

    // Find the permission config
    const permConfig = parsedPermissions.find((p: ParsedPermission) => p.permission === permission);
    if (!permConfig) {
        return true; // No specific config, allow all
    }

    // If no allowPaths, allow all
    if (!permConfig.allowPaths || permConfig.allowPaths.length === 0) {
        return true;
    }

    // Check if path matches any allowed pattern
    return permConfig.allowPaths.some((pattern: string) => pathMatches(path, pattern));
}

/**
 * Check if extension has permission for a specific shell command
 */
function hasShellPermission(extensionInfo: ExtensionHostInfo, program: string, args: string[]): boolean {
    // First check simple permission
    if (!hasPermission(extensionInfo, 'shell')) {
        return false;
    }

    // If no parsed permissions, allow all (backward compatibility - but not recommended)
    const parsedPermissions = extensionInfo.parsedPermissions;
    if (!parsedPermissions) {
        return true;
    }

    // Find the shell permission config
    const permConfig = parsedPermissions.find((p: ParsedPermission) => p.permission === 'shell');
    if (!permConfig) {
        return true; // No specific config, allow all
    }

    // If no allowCommands, allow all
    if (!permConfig.allowCommands || permConfig.allowCommands.length === 0) {
        return true;
    }

    // Check if command matches any allowed pattern
    return permConfig.allowCommands.some((rule) => {
        // Check program name matches
        if (rule.program !== program) {
            return false;
        }

        // If no args patterns specified, allow any args
        if (!rule.args || rule.args.length === 0) {
            return true;
        }

        // Check if all provided args match the patterns
        // Each arg must match the corresponding pattern
        if (args.length > rule.args.length) {
            return false; // More args than patterns
        }

        return args.every((arg, index) => {
            const pattern = rule.args![index];
            if (!pattern) return false;
            try {
                const regex = new RegExp(`^${pattern}$`);
                return regex.test(arg);
            } catch {
                return false;
            }
        });
    });
}

/**
 * Create Rua API implementation
 */
export function createRuaAPI(
    extensionInfo: ExtensionHostInfo,
    callbacks: RuaHostCallbacks
): RuaServerAPI {
    return {
        async getExtensionInfo(): Promise<ExtensionMeta> {
            return {
                id: extensionInfo.id,
                name: extensionInfo.name,
                version: extensionInfo.version,
            };
        },

        // Clipboard API
        async clipboardReadText(): Promise<string> {
            if (!hasPermission(extensionInfo, 'clipboard')) {
                throw new Error('PERMISSION_DENIED: clipboard permission required');
            }
            return await invoke<string>('read_clipboard');
        },

        async clipboardWriteText(text: string): Promise<void> {
            if (!hasPermission(extensionInfo, 'clipboard')) {
                throw new Error('PERMISSION_DENIED: clipboard permission required');
            }
            await invoke('write_clipboard', { text });
        },

        // Notification API
        async notificationShow(options: { title: string; body?: string }): Promise<void> {
            if (!hasPermission(extensionInfo, 'notification')) {
                throw new Error('PERMISSION_DENIED: notification permission required');
            }
            await invoke('show_notification', options);
        },

        // Storage API
        async storageGet(key: string): Promise<string | null> {
            console.log(extensionInfo)
            if (!hasPermission(extensionInfo, 'storage')) {
                throw new Error('PERMISSION_DENIED: storage permission required');
            }
            return await invoke('extension_storage_get', {
                extensionId: extensionInfo.id,
                key,
            });
        },

        async storageSet(key: string, value: string): Promise<void> {
            if (!hasPermission(extensionInfo, 'storage')) {
                throw new Error('PERMISSION_DENIED: storage permission required');
            }
            await invoke('extension_storage_set', {
                extensionId: extensionInfo.id,
                key,
                value,
            });
        },

        async storageRemove(key: string): Promise<void> {
            if (!hasPermission(extensionInfo, 'storage')) {
                throw new Error('PERMISSION_DENIED: storage permission required');
            }
            await invoke('extension_storage_remove', {
                extensionId: extensionInfo.id,
                key,
            });
        },

        // File System API
        async fsReadTextFile(path: string): Promise<string> {
            if (!hasPathPermission(extensionInfo, 'fs:read', path)) {
                throw new Error(`PERMISSION_DENIED: fs:read permission required for path: ${path}`);
            }
            return await invoke<string>('fs_read_text_file', { path });
        },

        async fsReadBinaryFile(path: string): Promise<number[]> {
            if (!hasPathPermission(extensionInfo, 'fs:read', path)) {
                throw new Error(`PERMISSION_DENIED: fs:read permission required for path: ${path}`);
            }
            return await invoke<number[]>('fs_read_binary_file', { path });
        },

        async fsWriteTextFile(path: string, contents: string): Promise<void> {
            if (!hasPathPermission(extensionInfo, 'fs:write', path)) {
                throw new Error(`PERMISSION_DENIED: fs:write permission required for path: ${path}`);
            }
            await invoke('fs_write_text_file', { path, contents });
        },

        async fsWriteBinaryFile(path: string, contents: number[]): Promise<void> {
            if (!hasPathPermission(extensionInfo, 'fs:write', path)) {
                throw new Error(`PERMISSION_DENIED: fs:write permission required for path: ${path}`);
            }
            await invoke('fs_write_binary_file', { path, contents });
        },

        async fsReadDir(path: string): Promise<{ name: string; isFile: boolean; isDirectory: boolean }[]> {
            if (!hasPathPermission(extensionInfo, 'fs:read-dir', path)) {
                throw new Error(`PERMISSION_DENIED: fs:read-dir permission required for path: ${path}`);
            }
            return await invoke('fs_read_dir', { path });
        },

        async fsExists(path: string): Promise<boolean> {
            if (!hasPathPermission(extensionInfo, 'fs:exists', path)) {
                throw new Error(`PERMISSION_DENIED: fs:exists permission required for path: ${path}`);
            }
            return await invoke<boolean>('fs_exists', { path });
        },

        async fsStat(path: string): Promise<{ size: number; isFile: boolean; isDirectory: boolean; mtime: number; ctime: number }> {
            if (!hasPathPermission(extensionInfo, 'fs:stat', path)) {
                throw new Error(`PERMISSION_DENIED: fs:stat permission required for path: ${path}`);
            }
            return await invoke('fs_stat', { path });
        },

        // Shell API
        async shellExecute(program: string, args: string[]): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number | null }> {
            if (!hasShellPermission(extensionInfo, program, args)) {
                throw new Error(`PERMISSION_DENIED: shell permission required for command: ${program} ${args.join(' ')}`);
            }
            // Build the full command string for the shell executor
            const command = [program, ...args].join(' ');
            const result = await invoke<{ success: boolean; stdout: string; stderr: string; exit_code: number | null }>('execute_shell_command', { command });
            return {
                success: result.success,
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exit_code,
            };
        },

        // UI API (no permission required)
        async uiHideInput(): Promise<void> {
            callbacks.onHideInput?.();
        },

        async uiShowInput(): Promise<void> {
            callbacks.onShowInput?.();
        },

        async uiClose(): Promise<void> {
            callbacks.onClose?.();
        },

        async uiSetTitle(title: string): Promise<void> {
            callbacks.onSetTitle?.(title);
        },

        // Actions API (no permission required)
        async actionsRegister(actions: DynamicAction[]): Promise<void> {
            callbacks.onRegisterActions?.(actions);
        },

        async actionsUnregister(actionIds: string[]): Promise<void> {
            callbacks.onUnregisterActions?.(actionIds);
        },
    };
}

/**
 * Create the server API for extensions
 */
export function createExtensionServerAPI(
    extensionInfo: ExtensionHostInfo,
    callbacks: RuaHostCallbacks
): RuaServerAPI {
    return createRuaAPI(extensionInfo, callbacks);
}

export type ExtensionServerAPI = RuaServerAPI;
