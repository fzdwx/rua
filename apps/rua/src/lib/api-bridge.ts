/**
 * API Bridge for Extension iframe communication
 * 
 * Handles postMessage communication between the main app and extension iframes.
 * Validates permissions and routes API calls to appropriate handlers.
 */

import { invoke } from '@tauri-apps/api/core';

/** API request message from iframe */
export interface APIRequest {
  type: 'api-request';
  requestId: string;
  method: string;
  args?: unknown[];
}

/** API response message to iframe */
export interface APIResponse {
  type: 'api-response';
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

/** Extension info for the bridge */
export interface ExtensionBridgeInfo {
  id: string;
  name: string;
  version: string;
  permissions: string[];
}

/** Callbacks for UI control */
export interface BridgeCallbacks {
  onHideInput?: () => void;
  onShowInput?: () => void;
  onClose?: () => void;
  onSetTitle?: (title: string) => void;
  onRegisterActions?: (actions: DynamicAction[]) => void;
  onUnregisterActions?: (actionIds: string[]) => void;
}

/** Dynamic action definition */
export interface DynamicAction {
  id: string;
  name: string;
  keywords?: string[];
  icon?: string;
  subtitle?: string;
  mode: 'view' | 'command';
}

/**
 * API Bridge class for managing iframe communication
 */
export class APIBridge {
  private iframe: HTMLIFrameElement | null = null;
  private extensionInfo: ExtensionBridgeInfo | null = null;
  private callbacks: BridgeCallbacks = {};
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  /**
   * Initialize the bridge for an iframe
   */
  init(
    iframe: HTMLIFrameElement,
    extensionInfo: ExtensionBridgeInfo,
    callbacks: BridgeCallbacks = {}
  ): void {
    this.iframe = iframe;
    this.extensionInfo = extensionInfo;
    this.callbacks = callbacks;

    // Set up message listener
    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageHandler);

    console.log('[APIBridge] Initialized for extension:', extensionInfo.id);
  }

  /**
   * Check if extension has a specific permission
   */
  private hasPermission(permission: string): boolean {
    return this.extensionInfo?.permissions.includes(permission) ?? false;
  }

  /**
   * Send response back to iframe
   */
  private sendResponse(requestId: string, data?: unknown, error?: string): void {
    if (!this.iframe?.contentWindow) return;

    const response: APIResponse = {
      type: 'api-response',
      requestId,
      success: !error,
      data,
      error,
    };

    this.iframe.contentWindow.postMessage(response, '*');
  }

  /**
   * Handle incoming messages from iframe
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    // Validate message origin (should come from our iframe)
    if (!this.iframe || event.source !== this.iframe.contentWindow) {
      return;
    }

    const message = event.data as APIRequest;
    if (message.type !== 'api-request') {
      return;
    }

    const { requestId, method, args = [] } = message;
    console.log('[APIBridge] Received request:', method, args);

    try {
      const result = await this.handleAPICall(method, args);
      this.sendResponse(requestId, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[APIBridge] Error handling request:', method, errorMessage);
      this.sendResponse(requestId, undefined, errorMessage);
    }
  }

  /**
   * Route API calls to appropriate handlers
   */
  private async handleAPICall(method: string, args: unknown[]): Promise<unknown> {
    switch (method) {
      // Clipboard API
      case 'clipboard.read':
        if (!this.hasPermission('clipboard')) {
          throw new Error('PERMISSION_DENIED: clipboard permission required');
        }
        return await invoke<string>('read_clipboard');

      case 'clipboard.write':
        if (!this.hasPermission('clipboard')) {
          throw new Error('PERMISSION_DENIED: clipboard permission required');
        }
        await invoke('write_clipboard', { text: args[0] as string });
        return;

      // Notification API
      case 'notification.show':
        if (!this.hasPermission('notification')) {
          throw new Error('PERMISSION_DENIED: notification permission required');
        }
        const notifyOptions = args[0] as { title: string; body?: string };
        await invoke('show_notification', notifyOptions);
        return;

      // Storage API
      case 'storage.get':
        if (!this.hasPermission('storage')) {
          throw new Error('PERMISSION_DENIED: storage permission required');
        }
        return await invoke('extension_storage_get', {
          extensionId: this.extensionInfo?.id,
          key: args[0] as string,
        });

      case 'storage.set':
        if (!this.hasPermission('storage')) {
          throw new Error('PERMISSION_DENIED: storage permission required');
        }
        await invoke('extension_storage_set', {
          extensionId: this.extensionInfo?.id,
          key: args[0] as string,
          value: JSON.stringify(args[1]),
        });
        return;

      case 'storage.remove':
        if (!this.hasPermission('storage')) {
          throw new Error('PERMISSION_DENIED: storage permission required');
        }
        await invoke('extension_storage_remove', {
          extensionId: this.extensionInfo?.id,
          key: args[0] as string,
        });
        return;

      // UI API
      case 'ui.hideInput':
        this.callbacks.onHideInput?.();
        return;

      case 'ui.showInput':
        this.callbacks.onShowInput?.();
        return;

      case 'ui.close':
        this.callbacks.onClose?.();
        return;

      case 'ui.setTitle':
        this.callbacks.onSetTitle?.(args[0] as string);
        return;

      // Actions API
      case 'actions.register':
        this.callbacks.onRegisterActions?.(args[0] as DynamicAction[]);
        return;

      case 'actions.unregister':
        this.callbacks.onUnregisterActions?.(args[0] as string[]);
        return;

      default:
        throw new Error(`Unknown API method: ${method}`);
    }
  }

  /**
   * Cleanup when bridge is destroyed
   */
  destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
    this.iframe = null;
    this.extensionInfo = null;
    this.callbacks = {};
    console.log('[APIBridge] Destroyed');
  }
}

/**
 * Create a new API Bridge instance
 */
export function createAPIBridge(): APIBridge {
  return new APIBridge();
}
