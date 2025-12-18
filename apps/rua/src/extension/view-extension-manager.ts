/**
 * View Extension Manager
 *
 * Manages the currently active view mode extension and provides notification functionality.
 * This allows the ExtensionSystemContext to notify the active view extension of activate/deactivate events.
 *
 * Note: Only one view extension can be active at a time.
 */

import type { RuaClientCallbacks } from "rua-api";

// Currently active view extension and its RPC API
let activeViewExtension: { extensionId: string; clientAPI: RuaClientCallbacks } | null = null;

/**
 * Register a view extension's RPC client API
 * This should be called when an extension's iframe loads and RPC is established
 * Replaces any previously active view extension
 */
export function registerViewExtension(
  extensionId: string,
  clientAPI: RuaClientCallbacks
): void {
  console.log("[ViewExtensionManager] Registering view extension:", extensionId);
  activeViewExtension = { extensionId, clientAPI };
}

/**
 * Unregister a view extension's RPC client API
 * This should be called when an extension's iframe is unmounted
 */
export function unregisterViewExtension(extensionId: string): void {
  if (activeViewExtension?.extensionId === extensionId) {
    console.log("[ViewExtensionManager] Unregistering view extension:", extensionId);
    activeViewExtension = null;
  }
}

/**
 * Notify the active view extension that the main window is activated
 */
export async function notifyViewExtensionsActivate(): Promise<void> {
  if (!activeViewExtension) {
    console.log("[ViewExtensionManager] No active view extension to notify activate");
    return;
  }

  const { extensionId, clientAPI } = activeViewExtension;
  console.log("[ViewExtensionManager] Notifying activate to view extension:", extensionId);

  try {
    if (clientAPI.onActivate) {
      clientAPI.onActivate();
      console.log("[ViewExtensionManager] Notified activate:", extensionId);
    }
  } catch (error) {
    console.warn("[ViewExtensionManager] Failed to notify activate:", extensionId, error);
  }
}

/**
 * Notify the active view extension that the main window is deactivated
 */
export async function notifyViewExtensionsDeactivate(): Promise<void> {
  if (!activeViewExtension) {
    console.log("[ViewExtensionManager] No active view extension to notify deactivate");
    return;
  }

  const { extensionId, clientAPI } = activeViewExtension;
  console.log("[ViewExtensionManager] Notifying deactivate to view extension:", extensionId);

  try {
    if (clientAPI.onDeactivate) {
      clientAPI.onDeactivate();
      console.log("[ViewExtensionManager] Notified deactivate:", extensionId);
    }
  } catch (error) {
    console.warn("[ViewExtensionManager] Failed to notify deactivate:", extensionId, error);
  }
}
