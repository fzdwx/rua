import * as React from "react";
import {QuickLink} from "@/hooks/useQuickLinks.tsx";
import {openUrl} from "@tauri-apps/plugin-opener";
import {readText} from "@tauri-apps/plugin-clipboard-manager";
import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";

interface QuickLinkViewProps {
    quickLink: QuickLink;
    search: string;
    onLoadingChange?: (loading: boolean) => void;
    onReturn?: () => void; // Called after successfully opening link
}

/**
 * QuickLinkView component - for executing quick link with optional parameters
 */
export function QuickLinkView({quickLink, search, onLoadingChange, onReturn}: QuickLinkViewProps) {
    const [finalUrl, setFinalUrl] = React.useState(quickLink.url);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Process URL and replace variables
    React.useEffect(() => {
        const processUrl = async () => {
            let url = quickLink.url;

            // Replace {query} with search input
            if (url.includes('{query}')) {
                const queryValue = search.trim() || '';
                url = url.replace(/\{query\}/g, encodeURIComponent(queryValue));
            }

            // Replace {selection} with clipboard content
            if (url.includes('{selection}')) {
                try {
                    const clipboardText = await readText();
                    const selectionValue = clipboardText || '';
                    url = url.replace(/\{selection\}/g, encodeURIComponent(selectionValue));
                } catch (error) {
                    console.error('Failed to read clipboard:', error);
                    // If clipboard read fails, replace with empty string
                    url = url.replace(/\{selection\}/g, '');
                }
            }

            setFinalUrl(url);
        };

        processUrl();
    }, [search, quickLink.url]);

    // Handle opening the URL
    const handleOpen = async () => {
        setIsLoading(true);
        setError(null);
        onLoadingChange?.(true);

        try {
            // Hide window immediately before opening link
            await getCurrentWebviewWindow().hide();
            // Open the URL
            await openUrl(finalUrl);
            // Return to previous view after successfully opening
            onReturn?.();
        } catch (error) {
            console.error("Failed to open link:", error);
            setError("无法打开链接，请检查 URL 格式");
            // Show window again if opening failed
            await getCurrentWebviewWindow().show();
        } finally {
            setIsLoading(false);
            onLoadingChange?.(false);
        }
    };

    // Auto-open when URL is ready (all variables resolved)
    React.useEffect(() => {
        // Wait for URL processing to complete
        const hasUnresolvedPlaceholders = /\{(query|selection)\}/.test(finalUrl);

        // Auto-open if there are no unresolved placeholders
        if (!hasUnresolvedPlaceholders && finalUrl) {
            handleOpen();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalUrl]); // Trigger when finalUrl changes

    const hasPlaceholders = /\{(query|selection)\}/.test(quickLink.url);
    const hasUnresolvedPlaceholders = /\{(query|selection)\}/.test(finalUrl);

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Header with link info */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div style={{fontSize: "32px"}}>
                        {quickLink.icon || "🔗"}
                    </div>
                    <div>
                        <div className="text-xl font-semibold" style={{color: "var(--gray12)"}}>
                            {quickLink.name}
                        </div>
                        {quickLink.subtitle && (
                            <div className="text-sm" style={{color: "var(--gray11)"}}>
                                {quickLink.subtitle}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* URL preview */}
            <div
                className="mb-4 p-4 rounded-lg border"
                style={{
                    background: "var(--gray3)",
                    borderColor: "var(--gray6)",
                }}
            >
                <div className="text-xs mb-2 font-medium" style={{color: "var(--gray11)"}}>
                    将要打开的链接:
                </div>
                <div
                    className="text-sm font-mono break-all"
                    style={{color: "var(--gray12)"}}
                >
                    {finalUrl}
                </div>
            </div>

            {/* Help text for placeholders */}
            {hasPlaceholders && (
                <div
                    className="mb-4 p-4 rounded-lg border"
                    style={{
                        background: "var(--blue3)",
                        borderColor: "var(--blue6)",
                        color: "var(--blue11)",
                    }}
                >
                    <div className="text-sm font-medium mb-2">
                        💡 变量说明
                    </div>
                    <div className="text-xs space-y-1">
                        {quickLink.url.includes('{query}') && (
                            <div>• <code className="px-1 rounded" style={{background: "var(--blue4)"}}>{'query'}</code> - 在搜索框中输入的内容</div>
                        )}
                        {quickLink.url.includes('{selection}') && (
                            <div>• <code className="px-1 rounded" style={{background: "var(--blue4)"}}>{'selection'}</code> - 剪贴板中的文本内容</div>
                        )}
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div
                    className="mb-4 p-4 rounded-lg border"
                    style={{
                        background: "var(--red3)",
                        borderColor: "var(--red6)",
                        color: "var(--red11)",
                    }}
                >
                    <div className="text-sm">⚠️ {error}</div>
                </div>
            )}

            {/* Open button */}
            <button
                onClick={handleOpen}
                disabled={isLoading || hasUnresolvedPlaceholders}
                className="w-full px-4 py-3 rounded-md font-medium transition-colors"
                style={{
                    background: isLoading || hasUnresolvedPlaceholders ? "var(--gray6)" : "var(--blue9)",
                    color: "white",
                    cursor: isLoading || hasUnresolvedPlaceholders ? "not-allowed" : "pointer",
                    opacity: hasUnresolvedPlaceholders ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                    if (!isLoading && !hasUnresolvedPlaceholders) {
                        e.currentTarget.style.background = "var(--blue10)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isLoading && !hasUnresolvedPlaceholders) {
                        e.currentTarget.style.background = "var(--blue9)";
                    }
                }}
            >
                {isLoading ? "打开中..." : hasUnresolvedPlaceholders ? "请填写必需参数" : "打开链接"}
            </button>

            {hasUnresolvedPlaceholders && search.trim() === '' && quickLink.url.includes('{query}') && (
                <div className="text-xs text-center mt-2" style={{color: "var(--gray11)"}}>
                    提示：在搜索框中输入查询内容
                </div>
            )}
        </div>
    );
}
