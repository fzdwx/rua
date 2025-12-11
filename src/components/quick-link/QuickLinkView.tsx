import * as React from "react";
import {QuickLink} from "@/hooks/useQuickLinks.tsx";
import {openUrl} from "@tauri-apps/plugin-opener";
import {readClipboard} from "@/utils/clipboard";
import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {useKeyPress} from "ahooks";
import {invoke} from "@tauri-apps/api/core";
import {motion} from "motion/react";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {Loader2, AlertCircle, Info, ExternalLink, Terminal} from "lucide-react";

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
                // Execute shell command using Tauri command
                console.log("Executing shell command:", finalUrl);
                const result = await invoke<{success: boolean, stdout: string, stderr: string, exit_code: number | null}>(
                    "execute_shell_command",
                    { command: finalUrl }
                );

                // Log the result for debugging
                console.log("Shell command result:", result);

                // Check if command failed
                if (!result.success) {
                    throw new Error(`命令执行失败 (退出码: ${result.exit_code})\n${result.stderr || result.stdout}`);
                }
            } else {
                // Open URL in browser
                await openUrl(finalUrl);
            }

            // Return to previous view after successfully executing
            onReturn?.();
        } catch (error) {
            console.error(`Failed to ${openType === "shell" ? "execute command" : "open link"}:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setError(openType === "shell"
                ? `无法执行命令：${errorMessage}`
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
    const openType = quickLink.openType || "url";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="p-6 max-w-2xl mx-auto overflow-y-auto"
            style={{flex: 1}}
        >
            {/* Header Card with link info */}
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
            >
                <Card className="mb-4 border-none shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-start gap-4">
                            <motion.div
                                className="flex-shrink-0"
                                initial={{ rotate: -10 }}
                                animate={{ rotate: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                            >
                                <div className="w-12 h-12 flex items-center justify-center text-3xl">
                                    {quickLink.icon ? (
                                        isUrl(quickLink.icon) ? (
                                            <img
                                                src={quickLink.icon}
                                                alt={quickLink.name}
                                                className="w-12 h-12 object-contain"
                                            />
                                        ) : (
                                            quickLink.icon
                                        )
                                    ) : quickLink.iconUrl ? (
                                        <img
                                            src={quickLink.iconUrl}
                                            alt={quickLink.name}
                                            className="w-12 h-12 object-contain"
                                        />
                                    ) : (
                                        "🔗"
                                    )}
                                </div>
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-semibold truncate">
                                    {quickLink.name}
                                </h2>
                                {quickLink.subtitle && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {quickLink.subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </motion.div>

            {/* URL/Command preview */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
            >
                <Card className="mb-4">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            {openType === "shell" ? (
                                <Terminal className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-xs font-medium text-muted-foreground">
                                {openType === "shell" ? "将要执行的命令" : "将要打开的链接"}
                            </span>
                        </div>
                        <code className="block text-sm font-mono break-all bg-muted p-3 rounded-md">
                            {finalUrl}
                        </code>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Help text for placeholders */}
            {hasPlaceholders && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                >
                    <Alert className="mb-4">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            <div className="font-medium mb-2">变量说明</div>
                            <div className="space-y-1.5 text-xs">
                                {quickLink.url.includes('{query}') && (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            query
                                        </Badge>
                                        <span>在搜索框中输入的内容</span>
                                    </div>
                                )}
                                {quickLink.url.includes('{selection}') && (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            selection
                                        </Badge>
                                        <span>剪贴板中的文本内容</span>
                                    </div>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {/* Error message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {/* Open button */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
            >
                <Button
                    onClick={handleOpen}
                    disabled={isLoading || hasUnresolvedPlaceholders}
                    className="w-full h-11 text-base font-medium"
                    size="lg"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {openType === "shell" ? "执行中..." : "打开中..."}
                        </>
                    ) : hasUnresolvedPlaceholders ? (
                        "请填写必需参数"
                    ) : (
                        <>
                            {openType === "shell" ? (
                                <>
                                    <Terminal className="mr-2 h-4 w-4" />
                                    执行命令
                                </>
                            ) : (
                                <>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    打开链接
                                </>
                            )}
                        </>
                    )}
                </Button>

                {hasUnresolvedPlaceholders && search.trim() === '' && quickLink.url.includes('{query}') && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xs text-center text-muted-foreground mt-2"
                    >
                        提示：在搜索框中输入查询内容
                    </motion.p>
                )}
            </motion.div>
        </motion.div>
    );
}
