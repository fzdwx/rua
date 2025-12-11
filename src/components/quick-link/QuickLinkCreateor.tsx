import * as React from "react";
import {QuickLink, useQuickLinks} from "@/hooks/useQuickLinks";
import {Footer} from "@/command";
import {Icon} from "@iconify/react";
import {useKeyPress} from "ahooks";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Kbd, KbdGroup} from "@/components/ui/kbd.tsx";
import {getFaviconUrl} from "@/utils/favicon.ts";

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
    const variables = ['query', 'selection'];

    // Auto-focus on mount
    React.useEffect(() => {
        // Use setTimeout to ensure DOM is ready and other focus logic has completed
        const timer = setTimeout(() => {
            urlInputRef.current?.focus();
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    // Auto-fetch favicon when URL changes
    React.useEffect(() => {
        // Only fetch if URL is valid
        if (!url.trim()) {
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
    }, [url]);

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
            insertVariable(variables[activeMenuIndex]);
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
            setUrlError("请输入链接地址");
            urlInputRef.current?.focus();
            hasError = true;
        } else {
            // URL validation
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
                    icon: customIcon.trim() || undefined,
                    iconUrl: iconUrl || undefined,
                });
            } else {
                // Create new
                addQuickLink({
                    name: name.trim(),
                    url: url.trim(),
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
            <div className="w-full max-w-2xl mx-auto px-6 py-8">
                {/* Form */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                    {/* URL input */}
                    <div className="relative space-y-2">
                        <Label htmlFor="url-input">
                            链接地址 <span className="text-red-500">*</span>
                        </Label>

                        <Input
                            id="url-input"
                            ref={urlInputRef}
                            type="text"
                            value={url}
                            onChange={handleUrlChange}
                            onKeyDown={handleUrlKeyDown}
                            placeholder="https://google.com/search?q={query}"
                            className={urlError ? "border-red-500 dark:border-red-500" : ""}
                        />

                        {urlError && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                {urlError}
                            </p>
                        )}

                        {/* Variable selection menu - only shown when typing { */}
                        {showVariableMenu && (
                            <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
                                {variables.map((variable, index) => (
                                    <div
                                        key={variable}
                                        className={`px-4 py-3 cursor-pointer transition-colors ${
                                            activeMenuIndex === index
                                                ? 'bg-gray-100 dark:bg-gray-800'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-850'
                                        }`}
                                        onMouseEnter={() => setActiveMenuIndex(index)}
                                        onClick={() => insertVariable(variable)}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">{variable}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {variable === 'query' ? '代表查询内容' : '代表选中的文本（粘贴板内容）'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!urlError && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                支持变量：输入 {'{'} 选择变量，例如 {'{query}'} 或 {'{selection}'}
                            </p>
                        )}
                    </div>

                    {/* Name input */}
                    <div className="space-y-2">
                        <Label htmlFor="name-input">
                            名称 <span className="text-red-500">*</span>
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
                            className={nameError ? "border-red-500 dark:border-red-500" : ""}
                        />
                        {nameError && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                {nameError}
                            </p>
                        )}
                    </div>

                    {/* Custom Icon input */}
                    <div className="space-y-2">
                        <Label htmlFor="icon-input">
                            图标 (可选)
                        </Label>
                        <Input
                            id="icon-input"
                            type="text"
                            value={customIcon}
                            onChange={(e) => setCustomIcon(e.target.value)}
                            placeholder="例如：🔗 或 https://example.com/icon.png"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            输入 emoji 表情或图标 URL 链接，留空则自动从网站获取 favicon
                        </p>
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
                        <div className="flex items-center gap-1.5 text-xs" style={{color: 'var(--gray11)'}}>
                            <span>{editingId ? "更新" : "创建"}</span>
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
