import * as React from "react";
import {QuickLink, QuickLinkOpenType, useQuickLinks} from "@/hooks/useQuickLinks";
import {Footer} from "@/command";
import {Icon} from "@iconify/react";
import {useKeyPress} from "ahooks";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Kbd, KbdGroup} from "@/components/ui/kbd.tsx";
import {getFaviconUrl} from "@/utils/favicon.ts";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface QuickLinkCreatorProps {
    onLoadingChange?: (loading: boolean) => void;
    onReturn?: () => void;
    editQuickLink?: QuickLink;
}

export function QuickLinkCreator({onLoadingChange, onReturn, editQuickLink}: QuickLinkCreatorProps) {
    const {addQuickLink, updateQuickLink} = useQuickLinks();
    const [editingId, setEditingId] = React.useState<string | null>(editQuickLink?.id || null);

    const [name, setName] = React.useState(editQuickLink?.name || "");
    const [url, setUrl] = React.useState(editQuickLink?.url || "");
    const [openType, setOpenType] = React.useState<QuickLinkOpenType>(editQuickLink?.openType || "url");
    const [customIcon, setCustomIcon] = React.useState(editQuickLink?.icon || "");
    const [iconUrl, setIconUrl] = React.useState<string | null>(editQuickLink?.iconUrl || null);
    const [showVariableMenu, setShowVariableMenu] = React.useState(false);
    const [variableMenuPosition, setVariableMenuPosition] = React.useState(0);
    const [activeMenuIndex, setActiveMenuIndex] = React.useState(0);
    const [urlError, setUrlError] = React.useState("");
    const [nameError, setNameError] = React.useState("");
    const [iconLoadError, setIconLoadError] = React.useState(false);

    const urlInputRef = React.useRef<HTMLInputElement>(null);
    const nameInputRef = React.useRef<HTMLInputElement>(null);

    const variables = [
        { name: 'query', description: '代表查询内容' },
        { name: 'selection', description: '代表选中的文本（粘贴板内容）' }
    ];

    // Check if a string is a URL
    const isUrl = (str: string): boolean => {
        if (!str) return false;
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    };

    // Reset icon load error when customIcon changes
    React.useEffect(() => {
        setIconLoadError(false);
    }, [customIcon]);

    // Auto-focus on mount
    React.useEffect(() => {
        const timer = setTimeout(() => {
            urlInputRef.current?.focus();
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    // Auto-fetch favicon when URL changes (only for URL type)
    React.useEffect(() => {
        if (openType !== "url" || !url.trim()) {
            setIconUrl(null);
            return;
        }

        try {
            new URL(url);
            const faviconUrl = getFaviconUrl(url);
            setIconUrl(faviconUrl);
        } catch {
            setIconUrl(null);
        }
    }, [url, openType]);

    // Add Ctrl+Enter shortcut
    useKeyPress('ctrl.enter', (e) => {
        e.preventDefault();
        handleSubmit();
    });

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;

        setUrl(newValue);
        setUrlError("");

        if (newValue[cursorPosition - 1] === '{') {
            setShowVariableMenu(true);
            setVariableMenuPosition(cursorPosition);
            setActiveMenuIndex(0);
        } else {
            setShowVariableMenu(false);
        }
    };

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

    const insertVariable = (variableName: string) => {
        const input = urlInputRef.current;
        if (!input) return;

        const cursorPosition = variableMenuPosition;
        const beforeCursor = url.substring(0, cursorPosition);
        const afterCursor = url.substring(cursorPosition);

        const newUrl = beforeCursor + variableName + '}' + afterCursor;
        setUrl(newUrl);
        setShowVariableMenu(false);
        setActiveMenuIndex(0);

        setTimeout(() => {
            const newCursorPos = cursorPosition + variableName.length + 1;
            input.focus();
            input.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    useKeyPress('esc', () => {
        if (showVariableMenu) {
            setShowVariableMenu(false);
            setActiveMenuIndex(0);
        } else {
            onReturn?.();
        }
    });

    const resetForm = () => {
        setName("");
        setUrl("");
        setOpenType("url");
        setCustomIcon("");
        setIconUrl(null);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        setUrlError("");
        setNameError("");

        let hasError = false;

        if (!url.trim()) {
            setUrlError(openType === "url" ? "请输入链接地址" : "请输入命令");
            urlInputRef.current?.focus();
            hasError = true;
        } else if (openType === "url") {
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
                updateQuickLink(editingId, {
                    name: name.trim(),
                    url: url.trim(),
                    openType,
                    icon: customIcon.trim() || undefined,
                    iconUrl: iconUrl || undefined,
                });
            } else {
                addQuickLink({
                    name: name.trim(),
                    url: url.trim(),
                    openType,
                    icon: customIcon.trim() || undefined,
                    iconUrl: iconUrl || undefined,
                });
            }

            resetForm();
            await new Promise(resolve => setTimeout(resolve, 100));
            onReturn?.();
        } catch (err) {
            console.error("Failed to save quick link:", err);
        } finally {
            onLoadingChange?.(false);
        }
    };

    return (
        <>
            <div className="w-full max-w-3xl mx-auto px-8 py-6 overflow-y-auto" style={{flex: 1}}>
                <div className="space-y-5 pt-20">
                    {/* URL/Command input */}
                    <div className="flex items-start gap-8">
                        <Label htmlFor="url-input" className="w-32 pt-2 text-right flex-shrink-0">
                            {openType === "url" ? "链接地址" : "Shell 命令"}
                            <span className="text-destructive ml-1">*</span>
                        </Label>
                        <div className="flex-1 relative">
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
                            {urlError && (
                                <p className="text-xs text-destructive pt-2">{urlError}</p>
                            )}
                            {!urlError && (
                                <p className="text-xs text-muted-foreground pt-2">
                                    输入 <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs">{"{"}</code> 可插入变量 {"{query}"} 或 {"{selection}"}
                                </p>
                            )}

                            {/* Variable selection menu */}
                            {showVariableMenu && (
                                <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-md">
                                    {variables.map((variable, index) => (
                                        <div
                                            key={variable.name}
                                            className={`px-3 py-2 cursor-pointer text-sm ${
                                                activeMenuIndex === index
                                                    ? 'bg-accent'
                                                    : 'hover:bg-accent/50'
                                            }`}
                                            onMouseEnter={() => setActiveMenuIndex(index)}
                                            onClick={() => insertVariable(variable.name)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {variable.name}
                                                </Badge>
                                                <span className="text-muted-foreground text-xs">
                                                    {variable.description}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name input */}
                    <div className="flex items-start gap-8">
                        <Label htmlFor="name-input" className="w-32 pt-2 text-right flex-shrink-0">
                            名称
                            <span className="text-destructive ml-1">*</span>
                        </Label>
                        <div className="flex-1">
                            <Input
                                id="name-input"
                                ref={nameInputRef}
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setNameError("");
                                }}
                                placeholder="例如：Google 搜索"
                                className={nameError ? "border-destructive" : ""}
                            />
                            {nameError && (
                                <p className="text-xs text-destructive mt-1.5">{nameError}</p>
                            )}
                        </div>
                    </div>

                    {/* Open Type selector */}
                    <div className="flex items-start gap-8">
                        <Label htmlFor="open-type-select" className="w-32 pt-2 text-right flex-shrink-0">
                            打开方式
                            <span className="text-destructive ml-1">*</span>
                        </Label>
                        <div className="flex-1">
                            <Select  value={openType} onValueChange={(value) => setOpenType(value as QuickLinkOpenType)}>
                                <SelectTrigger id="open-type-select" className="bg-background">
                                    <SelectValue placeholder="选择打开方式" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="url">浏览器打开 URL</SelectItem>
                                    <SelectItem value="shell">Shell 命令执行</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground pt-2">
                                {openType === "url"
                                    ? "将通过默认浏览器打开链接"
                                    : "将在终端中执行 shell 命令"}
                            </p>
                        </div>
                    </div>

                    {/* Custom Icon input */}
                    <div className="flex items-start gap-8">
                        <Label htmlFor="icon-input" className="w-32 pt-2 text-right flex-shrink-0">
                            图标
                        </Label>
                        <div className="flex-1">
                            <div className="flex gap-3 items-center">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-2xl border rounded-md bg-muted overflow-hidden">
                                    {(() => {
                                        // If customIcon is provided
                                        if (customIcon) {
                                            // Check if it's a URL
                                            if (isUrl(customIcon)) {
                                                // If previous load failed, show fallback
                                                if (iconLoadError) {
                                                    return iconUrl ? (
                                                        <img
                                                            src={iconUrl}
                                                            alt="icon"
                                                            className="w-6 h-6"
                                                            onError={() => {}}
                                                        />
                                                    ) : "🔗";
                                                }
                                                // Try to load as image
                                                return (
                                                    <img
                                                        src={customIcon}
                                                        alt="icon"
                                                        className="w-6 h-6"
                                                        onError={() => setIconLoadError(true)}
                                                    />
                                                );
                                            }
                                            // It's an emoji or text - show first character if too long
                                            const displayText = customIcon.length > 2 ? customIcon.substring(0, 1) : customIcon;
                                            return <span className="select-none">{displayText}</span>;
                                        }
                                        // No customIcon, show auto-fetched favicon or default
                                        if (iconUrl) {
                                            return (
                                                <img
                                                    src={iconUrl}
                                                    alt="icon"
                                                    className="w-6 h-6"
                                                    onError={() => {}}
                                                />
                                            );
                                        }
                                        return "🔗";
                                    })()}
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
                            <p className="text-xs text-muted-foreground pt-2">
                                输入 emoji 表情或图标 URL，留空则自动获取网站 favicon
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer
                current={null}
                icon={<Icon icon="tabler:link-plus" style={{fontSize: "20px"}}/>}
                actions={() => []}
                content={() => <div/>}
                rightElement={
                    <div className='flex items-center gap-3 pr-6'>
                        <Button
                            onClick={handleSubmit}
                            size="sm"
                            variant="outline"
                            className=""
                        >
                            {editingId ? "更新" : "创建"}
                        </Button>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <KbdGroup className="gap-1">
                                <Kbd>Ctrl</Kbd>
                                <Kbd>⏎</Kbd>
                            </KbdGroup>
                        </div>
                    </div>
                }
            />
        </>
    );
}
