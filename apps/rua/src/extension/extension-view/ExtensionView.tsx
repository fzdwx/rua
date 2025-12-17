/**
 * Extension View Component
 *
 * Renders an extension's HTML entry in an iframe.
 * Supports hot reload in dev mode via refreshKey prop.
 * Uses tauri-api-adapter + kkrpc for iframe communication.
 */

import {useEffect, useRef, useState, useMemo, useCallback} from 'react';
import {Icon} from '@iconify/react';
import {RPCChannel, IframeParentIO} from 'kkrpc/browser';
import {
    createExtensionServerAPI,
    type DynamicAction,
    type RuaClientCallbacks
} from '@/extension/extension-server-api.ts';
import type {ParsedPermission, RuaServerAPI} from 'rua-api';

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
                                  extensionId = 'unknown',
                                  extensionVersion = '0.0.0',
                                  permissions = [],
                                  parsedPermissions = [],
                                  onReturn,
                                  onInputVisibilityChange,
                                  onRegisterActions,
                                  onUnregisterActions,
                                  refreshKey = 0,
                                  search: _search = '',
                              }: ExtensionViewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const ioRef = useRef<IframeParentIO | null>(null);
    const rpcRef = useRef<RPCChannel<RuaServerAPI, RuaClientCallbacks> | null>(null);
    const [_loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [_title, setTitle] = useState(extensionName);

    // Convert file path to custom ext:// protocol URL
    // Format: ext://BASE64_ENCODED_BASE_DIR/filename?query
    // This allows Rust to resolve relative paths correctly
    const extUrl = useMemo(() => {
        if (!uiEntry) return '';

        // Split path and query params
        const [filePath, queryString] = uiEntry.split('?');

        // Get the directory and filename
        const lastSlash = filePath.lastIndexOf('/');
        const baseDir = filePath.substring(0, lastSlash);
        const fileName = filePath.substring(lastSlash + 1);

        // Encode base directory as URL-safe base64 in the host
        const encodedBaseDir = btoa(baseDir).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        // Use custom ext:// protocol - base dir in host, filename in path
        const baseUrl = `ext://${encodedBaseDir}/${fileName}`;

        // Build query string with refresh key for cache busting
        const params = new URLSearchParams(queryString || '');
        params.set('_r', String(refreshKey));

        return `${baseUrl}?${params.toString()}`;
    }, [uiEntry, refreshKey]);

    console.log('[ExtensionView] uiEntry:', uiEntry, 'extUrl:', extUrl, 'refreshKey:', refreshKey);

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
    const handleIframeLoad = useCallback(() => {
        setLoading(false);

        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) return;

        try {
            // Create kkrpc IO for iframe communication
            const io = new IframeParentIO(iframe.contentWindow);
            ioRef.current = io;

            // Create combined server API (tauri-api-adapter + Rua-specific)
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
                }
            );

            // Create RPC channel with exposed API
            const rpc = new RPCChannel<RuaServerAPI, RuaClientCallbacks>(io, {expose: serverAPI});
            rpcRef.current = rpc;

            console.log(`[ExtensionView] kkrpc connection established for ${extensionId}`);
        } catch (err) {
            console.error('[ExtensionView] Failed to setup RPC:', err);
        }
    }, [extensionId, extensionName, extensionVersion, permissions, parsedPermissions, onInputVisibilityChange, handleClose, onRegisterActions, onUnregisterActions]);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleError = () => {
            setLoading(false);
            setError('Failed to load extension view');
        };

        iframe.addEventListener('error', handleError);

        return () => {
            iframe.removeEventListener('error', handleError);
        };
    }, [refreshKey]);

    return (
        <div className="flex flex-col h-full">
            {/* Content */}
            <div className="flex-1 relative">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Icon icon="tabler:alert-circle" className="text-4xl mb-2 text-red-500"/>
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
