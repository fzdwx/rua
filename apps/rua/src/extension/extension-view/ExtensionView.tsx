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
import {useTheme} from '@/hooks/useTheme';

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
    const iframeDocRef = useRef<Document | null>(null);
    const [_loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [_title, setTitle] = useState(extensionName);
    const {theme} = useTheme();

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

    // Load main app CSS on component mount
    useEffect(() => {
        const loadMainAppCss = async () => {
            try {
                const cssContents: string[] = [];

                // 1. 从 <style> 标签获取内联 CSS (Vite dev mode)
                const styleTags = Array.from(
                    document.querySelectorAll<HTMLStyleElement>('style')
                );
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
                            console.warn('[ExtensionView] Failed to fetch CSS:', link.href, err);
                            return '';
                        }
                    })
                );
                cssContents.push(...externalCssContents);

                // 合并所有 CSS 内容
                const combinedCss = cssContents.filter(Boolean).join('\n');

                // 存储到全局变量，供 iframe 内的 script 访问
                (window as any).__RUA_MAIN_APP_CSS__ = combinedCss;

                console.log('[ExtensionView] Main app CSS loaded:', combinedCss.length, 'bytes');
            } catch (err) {
                console.error('[ExtensionView] Failed to load main app CSS:', err);
            }
        };

        loadMainAppCss();
    }, []); // 只在组件挂载时执行一次

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
    const handleIframeLoad = useCallback(() => {
        console.log('[ExtensionView] iframe loaded');
        setLoading(false);

        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) {
            console.log('[ExtensionView] No iframe contentWindow');
            return;
        }

        try {
            // ===== 通过注入 script 来加载 CSS =====
            // 自定义协议 ext:// 会导致跨域限制，直接访问 contentDocument 可能失败
            // 使用 script 注入的方式让 iframe 内部从 parent 获取 CSS
            const iframeDoc = iframe.contentDocument;
            if (iframeDoc) {
                iframeDocRef.current = iframeDoc;

                // 创建一个 script 标签，在 iframe 内部执行
                const script = iframeDoc.createElement('script');
                script.textContent = `
                    (function() {
                        try {
                            // 从 parent window 获取 CSS
                            const getMainAppCss = () => {
                                if (!window.parent || window.parent === window) return '';

                                // 尝试从 parent 的 __RUA_MAIN_APP_CSS__ 全局变量获取
                                return window.parent.__RUA_MAIN_APP_CSS__ || '';
                            };

                            const css = getMainAppCss();
                            if (!css) {
                                console.log('[Extension] No CSS from parent, will retry...');
                                // 延迟重试，等待 parent 设置 CSS
                                setTimeout(() => {
                                    const retryCSS = getMainAppCss();
                                    if (retryCSS) {
                                        injectCSS(retryCSS);
                                    }
                                }, 100);
                                return;
                            }

                            function injectCSS(cssContent) {
                                // 移除旧的样式标签
                                const oldStyle = document.getElementById('rua-main-app-styles');
                                if (oldStyle) {
                                    oldStyle.remove();
                                }

                                // 创建新的 style 标签
                                const styleElement = document.createElement('style');
                                styleElement.id = 'rua-main-app-styles';
                                styleElement.textContent = cssContent;

                                // 插入到 head 开头
                                const head = document.head;
                                if (head.firstChild) {
                                    head.insertBefore(styleElement, head.firstChild);
                                } else {
                                    head.appendChild(styleElement);
                                }

                                console.log('[Extension] Main app CSS injected:', cssContent.length, 'bytes');
                            }

                            injectCSS(css);
                        } catch (err) {
                            console.error('[Extension] Failed to inject CSS:', err);
                        }
                    })();
                `;

                // 插入 script 到 iframe head
                if (iframeDoc.head) {
                    iframeDoc.head.appendChild(script);
                    console.log('[ExtensionView] CSS injection script added to iframe');
                }
            }
            // ===== Script 注入结束 =====

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
                },
                theme
            );

            // Create RPC channel with exposed API
            const rpc = new RPCChannel<RuaServerAPI, RuaClientCallbacks>(io, {expose: serverAPI});
            rpcRef.current = rpc;

            console.log(`[ExtensionView] kkrpc connection established for ${extensionId}`);

            // Auto-focus iframe and notify extension to focus its input
            setTimeout(() => {
                iframeRef.current?.focus();
                // Notify extension to activate (which should trigger input focus in rua-ui)
                const clientAPI = rpc.getAPI();
                try {
                    clientAPI.onActivate?.();
                } catch (err) {
                    console.log('[ExtensionView] Failed to notify activation:', err);
                }
            }, 0);
        } catch (err) {
            console.error('[ExtensionView] Failed to setup RPC:', err);
        }
    }, [extensionId, extensionName, extensionVersion, permissions, parsedPermissions, onInputVisibilityChange, handleClose, onRegisterActions, onUnregisterActions, theme]);

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

    // Notify extension when theme changes
    useEffect(() => {
        if (rpcRef.current) {
            const clientAPI = rpcRef.current.getAPI();
            try {
                clientAPI.onThemeChange?.(theme);
            } catch (err) {
                console.log('[ExtensionView] Failed to notify theme change:', err);
            }
        }
    }, [theme]);

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
