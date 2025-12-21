/**
 * Extension Server API
 *
 * Rua-specific APIs exposed to extension iframes via kkrpc.
 */

import {
  ExtensionMeta,
  DynamicAction,
  RuaServerAPI,
  RuaHostCallbacks,
  ExtensionHostInfo,
  ShellResult,
  FileStat,
  DirEntry,
} from "rua-api";
import {
  apiCore,
  hasPathPermission,
  hasShellPermission,
  hasSimplePermission,
  permissionError,
} from "./rua-api-core.ts";

// Re-export types for convenience
export type {
  ExtensionMeta,
  DynamicAction,
  RuaHostCallbacks,
  RuaClientCallbacks,
  ExtensionHostInfo,
} from "rua-api";

/** Alias for RuaServerAPI */
export type RuaAPI = RuaServerAPI;

/**
 * Create Rua API implementation
 */
export function createRuaAPI(
  extensionInfo: ExtensionHostInfo,
  callbacks: RuaHostCallbacks,
  theme: "light" | "dark",
  cssStyles: string = ""
): RuaServerAPI {
  const checkPermission = (permission: string, detail?: string) => {
    if (!hasSimplePermission(extensionInfo.permissions, permission)) {
      throw permissionError(permission, detail);
    }
  };

  const checkPathPermission = (permission: string, path: string) => {
    if (!hasPathPermission(extensionInfo, permission, path)) {
      throw permissionError(permission, `path: ${path}`);
    }
  };

  const checkShellPermission = (program: string, args: string[]) => {
    if (!hasShellPermission(extensionInfo, program, args)) {
      throw permissionError("shell", `command: ${program} ${args.join(" ")}`);
    }
  };

  return {
    async getExtensionInfo(): Promise<ExtensionMeta> {
      return {
        id: extensionInfo.id,
        name: extensionInfo.name,
        version: extensionInfo.version,
        path: extensionInfo.path,
        currentAction: extensionInfo.currentAction,
      };
    },

    // Clipboard API
    async clipboardReadText(): Promise<string> {
      checkPermission("clipboard");
      return await apiCore.clipboardReadText();
    },

    async clipboardWriteText(text: string): Promise<void> {
      checkPermission("clipboard");
      await apiCore.clipboardWriteText(text);
    },

    // Notification API
    async notificationShow(options: { title: string; body?: string }): Promise<void> {
      checkPermission("notification");
      await apiCore.notificationShow(options);
    },

    // Storage API
    async storageGet(key: string): Promise<string | null> {
      checkPermission("storage");
      return await apiCore.storageGet(extensionInfo.id, key);
    },

    async storageSet(key: string, value: string): Promise<void> {
      checkPermission("storage");
      await apiCore.storageSet(extensionInfo.id, key, value);
    },

    async storageRemove(key: string): Promise<void> {
      checkPermission("storage");
      await apiCore.storageRemove(extensionInfo.id, key);
    },

    // File System API
    async fsReadTextFile(path: string, baseDir?: string): Promise<string> {
      const resolvedPath = apiCore.resolvePath(path, baseDir);
      checkPathPermission("fs:read", resolvedPath);
      return await apiCore.fsReadTextFile(resolvedPath);
    },

    async fsReadBinaryFile(path: string, baseDir?: string): Promise<Uint8Array> {
      const resolvedPath = apiCore.resolvePath(path, baseDir);
      checkPathPermission("fs:read", resolvedPath);
      return await apiCore.fsReadBinaryFile(resolvedPath);
    },

    async fsWriteTextFile(path: string, contents: string, baseDir?: string): Promise<void> {
      const resolvedPath = apiCore.resolvePath(path, baseDir);
      checkPathPermission("fs:write", resolvedPath);
      await apiCore.fsWriteTextFile(resolvedPath, contents);
    },

    async fsWriteBinaryFile(path: string, contents: Uint8Array, baseDir?: string): Promise<void> {
      const resolvedPath = apiCore.resolvePath(path, baseDir);
      checkPathPermission("fs:write", resolvedPath);
      await apiCore.fsWriteBinaryFile(resolvedPath, contents);
    },

    async fsReadDir(path: string, baseDir?: string): Promise<DirEntry[]> {
      const resolvedPath = apiCore.resolvePath(path, baseDir);
      checkPathPermission("fs:read-dir", resolvedPath);
      return await apiCore.fsReadDir(resolvedPath);
    },

    async fsExists(path: string, baseDir?: string): Promise<boolean> {
      const resolvedPath = apiCore.resolvePath(path, baseDir);
      checkPathPermission("fs:exists", resolvedPath);
      return await apiCore.fsExists(resolvedPath);
    },

    async fsStat(path: string, baseDir?: string): Promise<FileStat> {
      const resolvedPath = apiCore.resolvePath(path, baseDir);
      checkPathPermission("fs:stat", resolvedPath);
      return await apiCore.fsStat(resolvedPath);
    },

    // Shell API
    async shellExecute(program: string, args: string[]): Promise<ShellResult> {
      checkShellPermission(program, args);
      const command = [program, ...args].join(" ");
      return await apiCore.shellExecute(command);
    },

    async shellExecuteSpawn(program: string, args: string[]): Promise<string> {
      checkShellPermission(program, args);
      const command = [program, ...args].join(" ");
      return await apiCore.shellExecuteSpawn(command);
    },

    async uiClose(): Promise<void> {
      callbacks.onClose?.();
    },

    async uiSetTitle(title: string): Promise<void> {
      callbacks.onSetTitle?.(title);
    },

    async uiHideWindow(): Promise<void> {
      await apiCore.uiHideWindow();
    },

    async uiGetTheme(): Promise<"light" | "dark"> {
      return theme;
    },

    async uiGetStyles(): Promise<string> {
      return cssStyles;
    },

    async uiGetInitialSearch(): Promise<string> {
      return callbacks.getInitialSearch?.() || "";
    },

    // Actions API (no permission required)
    async actionsRegister(actions: DynamicAction[]): Promise<void> {
      callbacks.onRegisterActions?.(actions);
    },

    async actionsUnregister(actionIds: string[]): Promise<void> {
      callbacks.onUnregisterActions?.(actionIds);
    },

    // OS API (no permission required)
    async osPlatform(): Promise<"windows" | "linux" | "darwin"> {
      return await apiCore.platform();
    },
  };
}

/**
 * Create the server API for extensions
 */
export function createExtensionServerAPI(
  extensionInfo: ExtensionHostInfo,
  callbacks: RuaHostCallbacks,
  theme: "light" | "dark",
  cssStyles: string = ""
): RuaServerAPI {
  return createRuaAPI(extensionInfo, callbacks, theme, cssStyles);
}
