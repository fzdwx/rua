/**
 * Rua Extension Browser API
 *
 * This module provides the browser-side API for extensions.
 *
 * For iframe-based extensions (mode: "view" or "command"):
 *   Uses kkrpc for communication with the host application.
 *   const rua = await initializeRuaAPI()
 *   await rua.clipboard.readText()
 *   await rua.notification.show({ title: 'Hello' })
 *   await rua.storage.set('key', value)
 *
 * For background scripts (mode: "background"):
 *   Runs directly in the main program context.
 *   const rua = createMainContextRuaAPI()
 *   await rua.storage.set('key', value)
 *   rua.on('activate', () => console.log('activated'))
 */

// Iframe-based API (for view and command modes)
import {DirEntry, FileStat, ShellResult} from "../types";

export {initializeRuaAPI} from './rua-api';

// Main context API (for background mode)
export {createMainContextRuaAPI, getExtensionId} from './main-context-api';
export type {MainContextRuaAPI} from './main-context-api';

// Re-export types and enums
export type {
    RuaAPI,
    RuaClientAPI,
    ExtensionMeta,
    DynamicAction,
} from './rua-api';

export {BaseDirectory} from './rua-api';
export type {FsOptions} from '../types';

import {ExtensionMeta, FsOptions} from '../types';

export interface CommonRuaAPI {
    extension: ExtensionMeta;

    clipboard: {
        readText(): Promise<string>;
        writeText(text: string): Promise<void>;
    };

    notification: {
        show(options: { title: string; body?: string }): Promise<void>;
    };

    storage: {
        get<T>(key: string): Promise<T | null>;
        set<T>(key: string, value: T): Promise<void>;
        remove(key: string): Promise<void>;
    };

    fs: {
        /** Read file contents as text (requires fs:read permission) */
        readTextFile(path: string, options?: FsOptions): Promise<string>;
        /** Read file contents as binary (requires fs:read permission) */
        readBinaryFile(path: string, options?: FsOptions): Promise<Uint8Array>;
        /** Write text to file (requires fs:write permission) */
        writeTextFile(path: string, contents: string, options?: FsOptions): Promise<void>;
        /** Write binary data to file (requires fs:write permission) */
        writeBinaryFile(path: string, contents: Uint8Array, options?: FsOptions): Promise<void>;
        /** Read directory contents (requires fs:read-dir permission) */
        readDir(path: string, options?: FsOptions): Promise<DirEntry[]>;
        /** Check if file/directory exists (requires fs:exists permission) */
        exists(path: string, options?: FsOptions): Promise<boolean>;
        /** Get file/directory metadata (requires fs:stat permission) */
        stat(path: string, options?: FsOptions): Promise<FileStat>;
    };

    shell: {
        /** Execute a shell command (requires shell permission with matching allow rules) */
        execute(program: string, args?: string[]): Promise<ShellResult | string>;
    };

    hideWindow(): Promise<void>;

    os: {
        /** Get the current platform */
        platform(): Promise<'windows' | 'linux' | 'darwin'>;
    };
}
