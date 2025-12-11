import * as React from "react";
import {QuickLink, QuickLinkOpenType, useQuickLinks} from "@/hooks/useQuickLinks";
import {Footer} from "@/command";
import {Icon} from "@iconify/react";
import {useKeyPress} from "ahooks";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Kbd, KbdGroup} from "@/components/ui/kbd.tsx";
import {getFaviconUrl} from "@/utils/favicon.ts";
import {motion, AnimatePresence} from "motion/react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {ExternalLink, Terminal, Sparkles, Info} from "lucide-react";

interface QuickLinkCreatorProps {
    onLoadingChange?: (loading: boolean) => void;
    onReturn?: () => void; // Called after successfully creating/updating quick link
    editQuickLink?: QuickLink; // Quick link to edit (if in edit mode)
}

/**
 * QuickLinkCreator component - for creating and managing quick links
 */
export function QuickLinkCreator({onLoadingChange, onReturn, editQuickLink}: QuickLinkCreatorProps) {
    const {addQuickLink, updateQuickLink} = useQuickLinks();
    const [editingId, setEditingId] = React.useState<string | null>(editQuickLink?.id || null);

    const [name, setName] = React.useState(editQuickLink?.name || "");
    const [url, setUrl] = React.useState(editQuickLink?.url || "");
    const [openType, setOpenType] = React.useState<QuickLinkOpenType>(editQuickLink?.openType || "url");
    const [customIcon, setCustomIcon] = React.useState(editQuickLink?.icon || ""); // Manual icon input
    const [iconUrl, setIconUrl] = React.useState<string | null>(editQuickLink?.iconUrl || null);
    const [showVariableMenu, setShowVariableMenu] = React.useState(false);
    const [variableMenuPosition, setVariableMenuPosition] = React.useState(0);
    const [activeMenuIndex, setActiveMenuIndex] = React.useState(0);
    const [urlError, setUrlError] = React.useState("");
    const [nameError, setNameError] = React.useState("");

    // Ref for auto-focus
    const urlInputRef = React.useRef<HTMLInputElement>(null);
    const nameInputRef = React.useRef<HTMLInputElement>(null);

    // Available variables
    const variables = [
        { name: 'query', description: '代表查询内容' },
        { name: 'selection', description: '代表选中的文本（粘贴板内容）' }
    ];

    // Auto-focus on mount
    React.useEffect(() => {
        // Use setTimeout to ensure DOM is ready and other focus logic has completed
        const timer = setTimeout(() => {
            urlInputRef.current?.focus();
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    // Auto-fetch favicon when URL changes (only for URL type)
    React.useEffect(() => {
        // Only fetch if openType is "url" and URL is valid
        if (openType !== "url" || !url.trim()) {
            setIconUrl(null);
            return;
        }

        try {
            new URL(url);
            // URL is valid, fetch favicon
            const faviconUrl = getFaviconUrl(url);
            setIconUrl(faviconUrl);
        } catch {
            // Invalid URL, clear iconUrl
            setIconUrl(null);
        }
    }, [url, openType]);

    // Add Ctrl+Enter shortcut
    useKeyPress('ctrl.enter', (e) => {
        e.preventDefault();
        handleSubmit();
    });

    // Handle URL input change and detect { for variable menu
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;

        setUrl(newValue);
        setUrlError(""); // Clear error when user types

        // Check if user just typed {
        if (newValue[cursorPosition - 1] === '{') {
            setShowVariableMenu(true);
            setVariableMenuPosition(cursorPosition);
            setActiveMenuIndex(0); // Reset to first item
        } else {
            setShowVariableMenu(false);
        }
    };

    // Handle keyboard navigation in URL input when menu is open
    const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showVariableMenu) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveMenuIndex((prev) => (prev + 1) % variables.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveMenuIndex((prev) => (prev - 1 + variables.length) % variables.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            insertVariable(variables[activeMenuIndex].name);
        }
    };

    // Insert variable into URL
    const insertVariable = (variableName: string) => {
        const input = urlInputRef.current;
        if (!input) return;

        const cursorPosition = variableMenuPosition;
        const beforeCursor = url.substring(0, cursorPosition);
        const afterCursor = url.substring(cursorPosition);

        // Insert variable name and closing brace
        const newUrl = beforeCursor + variableName + '}' + afterCursor;
        setUrl(newUrl);
        setShowVariableMenu(false);
        setActiveMenuIndex(0); // Reset menu index

        // Set cursor position after the inserted variable
        setTimeout(() => {
            const newCursorPos = cursorPosition + variableName.length + 1;
            input.focus();
            input.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Close menu on Escape, or return to home if menu is not open
    useKeyPress('esc', () => {
        if (showVariableMenu) {
            setShowVariableMenu(false);
            setActiveMenuIndex(0); // Reset menu index
        } else {
            // Return to home if menu is not open
            onReturn?.();
        }
    });

    // Reset form
    const resetForm = () => {
        setName("");
        setUrl("");
        setOpenType("url");
        setCustomIcon("");
        setIconUrl(null);
        setEditingId(null);
    };

    // Handle submit (create or update)
    const handleSubmit = async () => {
        // Clear previous errors
        setUrlError("");
        setNameError("");

        // Validate inputs
        let hasError = false;

        if (!url.trim()) {
            setUrlError(openType === "url" ? "请输入链接地址" : "请输入命令");
            urlInputRef.current?.focus();
            hasError = true;
        } else if (openType === "url") {
            // URL validation (only for URL type)
            try {
                new URL(url);
            } catch {
                setUrlError("请输入有效的 URL 格式");
                urlInputRef.current?.focus();
                hasError = true;
            }
        }

        if (!name.trim()) {
            setNameError("请输入名称");
            if (!hasError) {
                nameInputRef.current?.focus();
            }
            hasError = true;
        }

        if (hasError) {
            return;
        }

        onLoadingChange?.(true);
        try {
            if (editingId) {
                // Update existing
                updateQuickLink(editingId, {
                    name: name.trim(),
                    url: url.trim(),
                    openType,
                    icon: customIcon.trim() || undefined,
                    iconUrl: iconUrl || undefined,
                });
            } else {
                // Create new
                addQuickLink({
                    name: name.trim(),
                    url: url.trim(),
                    openType,
                    icon: customIcon.trim() || undefined,
                    iconUrl: iconUrl || undefined,
                });
            }

            resetForm();

            // Wait for state updates to propagate before returning to main view
            // This ensures the actions list has time to refresh with the new quick link
            await new Promise(resolve => setTimeout(resolve, 100));

            // Return to main view after creating/updating
            onReturn?.();
        } catch (err) {
            console.error("Failed to save quick link:", err);
        } finally {
            onLoadingChange?.(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-2xl mx-auto px-6 py-8 overflow-y-auto"
                style={{flex: 1}}
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                {editingId ? "编辑快捷链接" : "创建快捷链接"}
                            </CardTitle>
                            <CardDescription>
                                {editingId
                                    ? "修改已有的快捷链接配置"
                                    : "创建一个新的快捷链接，支持变量和参数"}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Open Type selector */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-3"
                            >
                                <Label htmlFor="open-type-select" className="text-base">
                                    打开方式 <span className="text-destructive">*</span>
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant={openType === "url" ? "default" : "outline"}
                                        className="h-auto py-4 flex flex-col items-center gap-2"
                                        onClick={() => setOpenType("url")}
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        <div className="text-sm font-medium">浏览器</div>
                                        <div className="text-xs opacity-70">打开 URL 链接</div>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={openType === "shell" ? "default" : "outline"}
                                        className="h-auto py-4 flex flex-col items-center gap-2"
                                        onClick={() => setOpenType("shell")}
                                    >
                                        <Terminal className="w-5 h-5" />
                                        <div className="text-sm font-medium">终端</div>
                                        <div className="text-xs opacity-70">执行 Shell 命令</div>
                                    </Button>
                                </div>
                            </motion.div>

                            {/* URL input */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="relative space-y-3"
                            >
                                <Label htmlFor="url-input" className="text-base">
                                    {openType === "url" ? "链接地址" : "Shell 命令"}{" "}
                                    <span className="text-destructive">*</span>
                                </Label>

                                <Input
                                    id="url-input"
                                    ref={urlInputRef}
                                    type="text"
                                    value={url}
                                    onChange={handleUrlChange}
                                    onKeyDown={handleUrlKeyDown}
                                    placeholder={openType === "url"
                                        ? "https://google.com/search?q={query}"
                                        : "notify-send 'Hello' '{query}'"}
                                    className={`${urlError ? "border-destructive" : ""} font-mono text-sm`}
                                />

                                <AnimatePresence>
                                    {urlError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <Alert variant="destructive" className="py-2">
                                                <AlertDescription className="text-xs">
                                                    {urlError}
                                                </AlertDescription>
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Variable selection menu - only shown when typing { */}
                                <AnimatePresence>
                                    {showVariableMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute z-50 w-full mt-2"
                                        >
                                            <Card className="shadow-lg border-2">
                                                <CardContent className="p-0">
                                                    {variables.map((variable, index) => (
                                                        <motion.div
                                                            key={variable.name}
                                                            className={`px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                                                                activeMenuIndex === index
                                                                    ? 'bg-accent'
                                                                    : 'hover:bg-muted'
                                                            }`}
                                                            onMouseEnter={() => setActiveMenuIndex(index)}
                                                            onClick={() => insertVariable(variable.name)}
                                                            whileHover={{ x: 4 }}
                                                            transition={{ duration: 0.15 }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="secondary" className="font-mono">
                                                                    {variable.name}
                                                                </Badge>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {variable.description}
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!urlError && (
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertDescription className="text-xs">
                                            输入 <code className="px-1.5 py-0.5 rounded bg-muted font-mono">{"{"}</code> 可插入变量
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </motion.div>

                            {/* Name input */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-3"
                            >
                                <Label htmlFor="name-input" className="text-base">
                                    名称 <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name-input"
                                    ref={nameInputRef}
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setNameError(""); // Clear error when user types
                                    }}
                                    placeholder="例如：Google 搜索"
                                    className={nameError ? "border-destructive" : ""}
                                />
                                <AnimatePresence>
                                    {nameError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <Alert variant="destructive" className="py-2">
                                                <AlertDescription className="text-xs">
                                                    {nameError}
                                                </AlertDescription>
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Custom Icon input */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="space-y-3"
                            >
                                <Label htmlFor="icon-input" className="text-base">
                                    图标 <span className="text-muted-foreground text-sm font-normal">(可选)</span>
                                </Label>
                                <div className="flex gap-3 items-center">
                                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl border rounded-md bg-muted">
                                        {customIcon || (iconUrl ? <img src={iconUrl} alt="icon" className="w-6 h-6" /> : "🔗")}
                                    </div>
                                    <Input
                                        id="icon-input"
                                        type="text"
                                        value={customIcon}
                                        onChange={(e) => setCustomIcon(e.target.value)}
                                        placeholder="🔗 或 https://example.com/icon.png"
                                        className="flex-1"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    输入 emoji 表情或图标 URL，留空则自动获取网站 favicon
                                </p>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            <Footer
                current={null}
                icon={<Icon icon="tabler:link-plus" style={{fontSize: "20px"}}/>}
                actions={() => []}
                content={() => <div/>}
                rightElement={
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className='flex items-center gap-3 pr-6'
                    >
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{editingId ? "更新" : "创建"}</span>
                            <KbdGroup className="gap-1">
                                <Kbd>Ctrl</Kbd>
                                <Kbd>⏎</Kbd>
                            </KbdGroup>
                        </div>
                    </motion.div>
                }
            />
        </>
    );
}
