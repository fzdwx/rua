/**
 * Rua API Core
 *
 * Shared API implementation used by both background-executor and extension-server-api.
 * This module provides the core Tauri invoke calls for all Rua APIs.
 */

import { invoke } from '@tauri-apps/api/core';
import { ExtensionHostInfo, ParsedPermission } from 'rua-api';

/** File stat result */
export interface FileStat {
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    mtime: number;
    ctime: number;
}

/** Directory entry */
export interface DirEntry {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
}

/** Shell execution result */
export interface ShellResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number | null;
}

/**
 * Core API implementations - direct Tauri invoke calls
 */
export const apiCore = {
    // Clipboard
    async clipboardReadText(): Promise<string> {
        return await invoke<string>('read_clipboard');
    },

    async clipboardWriteText(text: string): Promise<void> {
        await invoke('write_clipboard', { text });
    },

    // Notification
    async notificationShow(options: { title: string; body?: string }): Promise<void> {
        await invoke('show_notification', options);
    },

    // Storage
    async storageGet(extensionId: string, key: string): Promise<string | null> {
        return await invoke<string | null>('extension_storage_get', {
            extensionId,
            key,
        });
    },

    async storageSet(extensionId: string, key: string, value: string): Promise<void> {
        await invoke('extension_storage_set', {
            extensionId,
            key,
            value,
        });
    },

    async storageRemove(extensionId: string, key: string): Promise<void> {
        await invoke('extension_storage_remove', {
            extensionId,
            key,
        });
    },

    // File System
    async fsReadTextFile(path: string): Promise<string> {
        return await invoke<string>('fs_read_text_file', { path });
    },

    async fsReadBinaryFile(path: string): Promise<number[]> {
        return await invoke<number[]>('fs_read_binary_file', { path });
    },

    async fsWriteTextFile(path: string, contents: string): Promise<void> {
        await invoke('fs_write_text_file', { path, contents });
    },

    async fsWriteBinaryFile(path: string, contents: number[]): Promise<void> {
        await invoke('fs_write_binary_file', { path, contents });
    },

    async fsReadDir(path: string): Promise<DirEntry[]> {
        return await invoke('fs_read_dir', { path });
    },

    async fsExists(path: string): Promise<boolean> {
        return await invoke<boolean>('fs_exists', { path });
    },

    async fsStat(path: string): Promise<FileStat> {
        return await invoke('fs_stat', { path });
    },

    // Shell
    async shellExecute(command: string): Promise<ShellResult> {
        const result = await invoke<{ success: boolean; stdout: string; stderr: string; exit_code: number | null }>('execute_shell_command', { command });
        return {
            success: result.success,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exit_code,
        };
    },

    /**
     * Resolve a path with optional base directory
     */
    resolvePath(path: string, baseDir?: string): string {
        if (!baseDir) {
            return path;
        }

        // Get base directory path
        const basePath = getBaseDirectoryPath(baseDir);
        if (!basePath) {
            return path;
        }

        // Join base path with relative path
        return `${basePath}/${path}`;
    },
};


/**
 * Get the actual path for a base directory
 */
function getBaseDirectoryPath(baseDir: string): string | null {
    const home = '$HOME';

    switch (baseDir) {
        case 'home':
            return home;
        case 'appData':
        case 'appLocalData':
            return `${home}/.local/share`;
        case 'appConfig':
            return `${home}/.config`;
        case 'desktop':
            return `${home}/Desktop`;
        case 'document':
            return `${home}/Documents`;
        case 'download':
            return `${home}/Downloads`;
        case 'picture':
            return `${home}/Pictures`;
        case 'video':
            return `${home}/Videos`;
        case 'audio':
            return `${home}/Music`;
        case 'temp':
            return '/tmp';
        default:
            return null;
    }
}

/**
 * Check if a simple permission is present
 */
export function hasSimplePermission(permissions: string[], permission: string): boolean {
    return permissions.includes(permission);
}

/**
 * Check if extension has permission for a specific shell command
 */
export function hasShellPermission(extensionInfo: ExtensionHostInfo, program: string, args: string[]): boolean {
    if (!hasSimplePermission(extensionInfo.permissions, 'shell')) {
        return false;
    }

    const parsedPermissions = extensionInfo.parsedPermissions;
    if (!parsedPermissions) {
        return true;
    }

    const permConfig = parsedPermissions.find((p: ParsedPermission) => p.permission === 'shell');
    if (!permConfig) {
        return true;
    }

    if (!permConfig.allowCommands || permConfig.allowCommands.length === 0) {
        return true;
    }

    return permConfig.allowCommands.some((rule) => {
        if (rule.program !== program) {
            return false;
        }

        if (!rule.args || rule.args.length === 0) {
            return true;
        }

        if (args.length > rule.args.length) {
            return false;
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
 * Check if extension has permission for a specific path
 */
export function hasPathPermission(extensionInfo: ExtensionHostInfo, permission: string, path: string): boolean {
    if (!hasSimplePermission(extensionInfo.permissions, permission)) {
        return false;
    }

    const parsedPermissions = extensionInfo.parsedPermissions;
    if (!parsedPermissions) {
        return true;
    }

    const permConfig = parsedPermissions.find((p: ParsedPermission) => p.permission === permission);
    if (!permConfig) {
        return true;
    }

    if (!permConfig.allowPaths || permConfig.allowPaths.length === 0) {
        return true;
    }

    return permConfig.allowPaths.some((pattern: string) => pathMatches(path, pattern));
}

/**
 * Check if a path matches a pattern
 */
function pathMatches(path: string, pattern: string): boolean {
    const expandedPattern = expandPath(pattern);

    const regexPattern = expandedPattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '<<<GLOBSTAR>>>')
        .replace(/\*/g, '[^/]*')
        .replace(/<<<GLOBSTAR>>>/g, '.*');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
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
 * Create permission error message
 */
export function permissionError(permission: string, detail?: string): Error {
    const message = detail
        ? `PERMISSION_DENIED: ${permission} permission required for ${detail}`
        : `PERMISSION_DENIED: ${permission} permission required`;
    return new Error(message);
}
