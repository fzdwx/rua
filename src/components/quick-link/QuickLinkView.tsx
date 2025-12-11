import * as React from "react";
import {QuickLink} from "@/hooks/useQuickLinks.tsx";
import {openUrl} from "@tauri-apps/plugin-opener";
import {readClipboard} from "@/utils/clipboard";
import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {useKeyPress} from "ahooks";
import {Command} from "@tauri-apps/plugin-shell";

/**
 * Check if a string is a URL or Data URL
 */
function isUrl(str: string): boolean {
    // Check for Data URL (data:image/png;base64,...)
    if (str.startsWith('data:')) {
        return true;
    }

    // Check for regular URL
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

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
    const [finalUrl, setFinalUrl] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // ESC key to return to home
    useKeyPress('esc', () => {
        onReturn?.();
    });

    // Process URL/command and replace variables
    React.useEffect(() => {
        const processUrl = async () => {
            let url = quickLink.url;
            const openType = quickLink.openType || "url";

            // Replace {query} with search input
            if (url.includes('{query}')) {
                const queryValue = search.trim() || '';
                // For URL type, encode the value; for shell, use raw value
                url = url.replace(/\{query\}/g, openType === "url" ? encodeURIComponent(queryValue) : queryValue);
            }

            // Replace {selection} with clipboard content
            if (url.includes('{selection}')) {
                try {
                    const clipboardText = await readClipboard();
                    const selectionValue = clipboardText || '';
                    // For URL type, encode the value; for shell, use raw value
                    url = url.replace(/\{selection\}/g, openType === "url" ? encodeURIComponent(selectionValue) : selectionValue);
                } catch (error) {
                    console.error('Failed to read clipboard:', error);
                    // If clipboard read fails, replace with empty string
                    url = url.replace(/\{selection\}/g, '');
                }
            }

            setFinalUrl(url);
        };

        processUrl();
    }, [search, quickLink.url, quickLink.openType]);

    // Handle opening the URL or executing shell command
    const handleOpen = async () => {
        setIsLoading(true);
        setError(null);
        onLoadingChange?.(true);

        const openType = quickLink.openType || "url";

        try {
            // Hide window immediately before executing
            await getCurrentWebviewWindow().hide();

            if (openType === "shell") {
                // Execute shell command
                console.log("Executing shell command:", finalUrl);
                const command = Command.create("sh", ["-c", finalUrl]);
                await command.execute();
            } else {
                // Open URL in browser
                await openUrl(finalUrl);
            }

            // Return to previous view after successfully executing
            onReturn?.();
        } catch (error) {
            console.error(`Failed to ${openType === "shell" ? "execute command" : "open link"}:`, error);
            setError(openType === "shell"
                ? "无法执行命令，请检查命令格式"
                : "无法打开链接，请检查 URL 格式");
            // Show window again if execution failed
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
                        {quickLink.icon ? (
                            isUrl(quickLink.icon) ? (
                                <img
                                    src={quickLink.icon}
                                    alt={quickLink.name}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        objectFit: "contain"
                                    }}
                                />
                            ) : (
                                quickLink.icon
                            )
                        ) : quickLink.iconUrl ? (
                            <img
                                src={quickLink.iconUrl}
                                alt={quickLink.name}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    objectFit: "contain"
                                }}
                            />
                        ) : (
                            "🔗"
                        )}
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
