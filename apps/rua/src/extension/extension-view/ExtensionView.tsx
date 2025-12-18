/**
 * Extension View Component
 *
 * Renders an extension's HTML entry in an iframe.
 * Supports hot reload in dev mode via refreshKey prop.
 * Uses tauri-api-adapter + kkrpc for iframe communication.
 */

import { useEffect, useRef, useState, useMemo, useCallback } from "react";

/**
 * Focus retry options for exponential backoff
 */
interface FocusRetryOptions {
  maxRetries?: number; // Default: 3
  initialDelay?: number; // Default: 50ms
  backoffMultiplier?: number; // Default: 2
}

/**
 * Calculate delay for a given attempt using exponential backoff
 * Formula: initialDelay * (backoffMultiplier ^ attempt)
 * For attempt 0: 50ms, attempt 1: 100ms, attempt 2: 200ms
 */
function calculateBackoffDelay(
  attempt: number,
  initialDelay: number = 50,
  backoffMultiplier: number = 2
): number {
  return initialDelay * Math.pow(backoffMultiplier, attempt);
}

/**
 * Attempt to notify extension activation with exponential backoff retry
 * Returns true if notification was successful, false otherwise
 */
async function attemptActivateWithRetry(
  getClientAPI: () => { onActivate?: () => void } | null,
  options: FocusRetryOptions = {}
): Promise<boolean> {
  const { maxRetries = 3, initialDelay = 50, backoffMultiplier = 2 } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const delay = calculateBackoffDelay(attempt, initialDelay, backoffMultiplier);

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      const clientAPI = getClientAPI();
      if (clientAPI?.onActivate) {
        clientAPI.onActivate();
        console.log(`[ExtensionView] onActivate called successfully on attempt ${attempt + 1}`);
        return true;
      }
    } catch (err) {
      console.log(`[ExtensionView] onActivate attempt ${attempt + 1} failed:`, err);
    }
  }

  // All retries exhausted
  console.warn(
    "[ExtensionView] Focus retry: All attempts exhausted, activation may not have succeeded"
  );
  return false;
}

import { Icon } from "@iconify/react";
import { RPCChannel, IframeParentIO } from "kkrpc/browser";
import {
  createExtensionServerAPI,
  type DynamicAction,
  type RuaClientCallbacks,
} from "@/extension/extension-server-api.ts";
import type { ParsedPermission, RuaServerAPI } from "rua-api";
import { useTheme } from "@/hooks/useTheme";

interface ExtensionViewProps {
  /** The extension's UI entry path with action query param */
  uiEntry: string;
  /** Extension name for display */
  extensionName: string;
  /** Extension ID for API bridge */
  extensionId?: string;
  /** Extension version */
  extensionVersion?: string;
  /** Extension permissions (simple strings) */
  permissions?: string[];
  /** Parsed permissions with allow rules */
  parsedPermissions?: ParsedPermission[];
  /** Callback when user wants to return */
  onReturn: () => void;
  /** Callback when extension requests input visibility change */
  onInputVisibilityChange?: (visible: boolean) => void;
  /** Callback when extension registers dynamic actions */
  onRegisterActions?: (actions: DynamicAction[]) => void;
  /** Callback when extension unregisters dynamic actions */
  onUnregisterActions?: (actionIds: string[]) => void;
  /** Refresh key for hot reload - changing this forces iframe remount */
  refreshKey?: number;
  /** Current search input value */
  search?: string;
}

export function ExtensionView({
  uiEntry,
  extensionName,
  extensionId = "unknown",
  extensionVersion = "0.0.0",
  permissions = [],
  parsedPermissions = [],
  onReturn,
  onInputVisibilityChange,
  onRegisterActions,
  onUnregisterActions,
  refreshKey = 0,
  search,
}: ExtensionViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ioRef = useRef<IframeParentIO | null>(null);
  const rpcRef = useRef<RPCChannel<RuaServerAPI, RuaClientCallbacks> | null>(null);
  const iframeDocRef = useRef<Document | null>(null);
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_title, setTitle] = useState(extensionName);
  const { theme } = useTheme();

  // Convert file path to custom ext:// protocol URL
  // Format: ext://BASE64_ENCODED_BASE_DIR/filename?query
  // This allows Rust to resolve relative paths correctly
  const extUrl = useMemo(() => {
    if (!uiEntry) return "";

    // Split path and query params
    const [filePath, queryString] = uiEntry.split("?");

    // Get the directory and filename
    const lastSlash = filePath.lastIndexOf("/");
    const baseDir = filePath.substring(0, lastSlash);
    const fileName = filePath.substring(lastSlash + 1);

    // Encode base directory as URL-safe base64 in the host
    const encodedBaseDir = btoa(baseDir).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    // Use custom ext:// protocol - base dir in host, filename in path
    const baseUrl = `ext://${encodedBaseDir}/${fileName}`;

    // Build query string with refresh key for cache busting
    const params = new URLSearchParams(queryString || "");
    params.set("_r", String(refreshKey));

    return `${baseUrl}?${params.toString()}`;
  }, [uiEntry, refreshKey]);

  // Collect main app CSS content
  const collectMainAppCss = useCallback(async (): Promise<string> => {
    try {
      const cssContents: string[] = [];

      // 1. 从 <style> 标签获取内联 CSS (Vite dev mode)
      const styleTags = Array.from(document.querySelectorAll<HTMLStyleElement>("style"));
      for (const styleTag of styleTags) {
        if (styleTag.textContent) {
          cssContents.push(styleTag.textContent);
        }
      }

      // 2. 从 <link rel="stylesheet"> 标签获取外部 CSS (production build)
      const stylesheets = Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
      );
      const externalCssContents = await Promise.all(
        stylesheets.map(async (link) => {
          try {
            const response = await fetch(link.href);
            return await response.text();
          } catch (err) {
            console.warn("[ExtensionView] Failed to fetch CSS:", link.href, err);
            return "";
          }
        })
      );
      cssContents.push(...externalCssContents);

      // 合并所有 CSS 内容
      return cssContents.filter(Boolean).join("\n");
    } catch (err) {
      console.error("[ExtensionView] Failed to collect main app CSS:", err);
      return "";
    }
  }, []);

  // Handle close with input visibility reset
  const handleClose = useCallback(() => {
    // Reset input visibility when closing
    onInputVisibilityChange?.(true);
    onReturn();
  }, [onReturn, onInputVisibilityChange]);

  // Reset loading state when refreshKey changes (hot reload)
  useEffect(() => {
    setLoading(true);
    setError(null);
    setTitle(extensionName);
    iframeDocRef.current = null;
  }, [refreshKey, extensionName]);

  // Cleanup RPC on unmount or refresh
  useEffect(() => {
    return () => {
      ioRef.current?.destroy();
      ioRef.current = null;
      rpcRef.current = null;
    };
  }, [refreshKey]);

  // Setup RPC when iframe loads
  const handleIframeLoad = useCallback(async () => {
    console.log("[ExtensionView] iframe loaded");
    setLoading(false);

    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) {
      console.log("[ExtensionView] No iframe contentWindow");
      return;
    }

    try {
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        iframeDocRef.current = iframeDoc;
      }

      // 收集主应用 CSS，通过 RPC API 提供给插件
      const cssContent = await collectMainAppCss();
      console.log("[ExtensionView] Collected CSS for RPC:", cssContent.length, "bytes");

      // Create kkrpc IO for iframe communication
      const io = new IframeParentIO(iframe.contentWindow);
      ioRef.current = io;

      // Create combined server API (tauri-api-adapter + Rua-specific)
      // CSS 内容通过 uiGetStyles() RPC 方法提供给插件
      const serverAPI = createExtensionServerAPI(
        {
          id: extensionId,
          name: extensionName,
          version: extensionVersion,
          permissions,
          parsedPermissions,
        },
        {
          onHideInput: () => onInputVisibilityChange?.(false),
          onShowInput: () => onInputVisibilityChange?.(true),
          onClose: handleClose,
          onSetTitle: setTitle,
          onRegisterActions,
          onUnregisterActions,
          getInitialSearch: () => search || "",
        },
        theme,
        cssContent
      );

      // Create RPC channel with exposed API
      const rpc = new RPCChannel<RuaServerAPI, RuaClientCallbacks>(io, { expose: serverAPI });
      rpcRef.current = rpc;

      console.log(`[ExtensionView] kkrpc connection established for ${extensionId}`);

      // Auto-focus iframe and notify extension to focus its input with retry mechanism
      iframeRef.current?.focus();

      // Use retry mechanism for activation notification
      // This ensures the extension's input gets focused even if there are timing issues
      attemptActivateWithRetry(() => rpc.getAPI(), {
        maxRetries: 3,
        initialDelay: 50,
        backoffMultiplier: 2,
      }).then((success) => {
        if (!success) {
          console.warn("[ExtensionView] Failed to activate extension after all retries");
        }
      });
    } catch (err) {
      console.error("[ExtensionView] Failed to setup RPC:", err);
    }
  }, [
    extensionId,
    extensionName,
    extensionVersion,
    permissions,
    parsedPermissions,
    onInputVisibilityChange,
    handleClose,
    onRegisterActions,
    onUnregisterActions,
    theme,
    collectMainAppCss,
  ]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleError = () => {
      setLoading(false);
      setError("Failed to load extension view");
    };

    iframe.addEventListener("error", handleError);

    return () => {
      iframe.removeEventListener("error", handleError);
    };
  }, [refreshKey]);

  // Notify extension when theme changes (rua-api will handle applying theme class)
  useEffect(() => {
    if (rpcRef.current) {
      const clientAPI = rpcRef.current.getAPI();
      try {
        clientAPI.onThemeChange?.(theme);
      } catch (err) {
        console.log("[ExtensionView] Failed to notify theme change:", err);
      }
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 relative">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Icon icon="tabler:alert-circle" className="text-4xl mb-2 text-red-500" />
            <p>{error}</p>
            <p className="text-sm mt-1">{uiEntry}</p>
          </div>
        ) : (
          <iframe
            key={`extension-iframe-${refreshKey}`}
            ref={iframeRef}
            src={extUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
            title={extensionName}
            onLoad={handleIframeLoad}
          />
        )}
      </div>
    </div>
  );
}
