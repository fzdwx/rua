import * as React from "react";
import {useQuickLinks} from "@/hooks/useQuickLinks";
import {Footer} from "@/command";
import {Icon} from "@iconify/react";
import {useKeyPress} from "ahooks";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";

interface QuickLinkCreatorProps {
    onLoadingChange?: (loading: boolean) => void;
    onReturn?: () => void; // Called after successfully creating/updating quick link
}

/**
 * QuickLinkCreator component - for creating and managing quick links
 */
export function QuickLinkCreator({onLoadingChange, onReturn}: QuickLinkCreatorProps) {
    const {addQuickLink, updateQuickLink} = useQuickLinks();
    const [editingId, setEditingId] = React.useState<string | null>(null);

    const [name, setName] = React.useState("");
    const [url, setUrl] = React.useState("");
    const [showVariableMenu, setShowVariableMenu] = React.useState(false);
    const [variableMenuPosition, setVariableMenuPosition] = React.useState(0);
    const [activeMenuIndex, setActiveMenuIndex] = React.useState(0);

    // Ref for auto-focus
    const urlInputRef = React.useRef<HTMLInputElement>(null);
    const nameInputRef = React.useRef<HTMLInputElement>(null);

    // Available variables
    const variables = ['query', 'selection'];

    // Auto-focus on mount
    React.useEffect(() => {
        urlInputRef.current?.focus();
    }, []);

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

    // Close menu on Escape
    useKeyPress('esc', () => {
        if (showVariableMenu) {
            setShowVariableMenu(false);
            setActiveMenuIndex(0); // Reset menu index
        }
    });

    // Reset form
    const resetForm = () => {
        setName("");
        setUrl("");
        setEditingId(null);
    };

    // Handle submit (create or update)
    const handleSubmit = async () => {
        // Validate inputs
        if (!name.trim() || !url.trim()) {
            return;
        }

        // Simple URL validation
        try {
            new URL(url);
        } catch {
            return;
        }

        onLoadingChange?.(true);
        try {
            if (editingId) {
                // Update existing
                updateQuickLink(editingId, {
                    name: name.trim(),
                    url: url.trim(),
                });
            } else {
                // Create new
                addQuickLink({
                    name: name.trim(),
                    url: url.trim(),
                });
            }

            resetForm();
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
            <div className="w-[600px] mx-auto space-y-6 m-4">
                {/* Form */}
                <div className="rounded-lg border p-5 space-y-4">
                    {/* URL input */}
                    <div className="relative">
                        <Label className="block text-sm font-medium mb-2" style={{color: 'var(--gray12)'}}>
                            链接地址 <span style={{color: 'var(--red9)'}}>*</span>
                        </Label>

                        <Input
                            ref={urlInputRef}
                            type="text"
                            value={url}
                            onChange={handleUrlChange}
                            onKeyDown={handleUrlKeyDown}
                            placeholder="https://google.com/search?q={query}"
                            className="w-full px-3 py-2 rounded-md border outline-none transition-colors duration-200 focus:ring-2"
                            style={{
                                background: "var(--gray3)",
                                borderColor: "var(--gray7)",
                                color: "var(--gray12)",
                            }}
                        />

                        {/* Variable selection menu - only shown when typing { */}
                        {showVariableMenu && (
                            <div
                                className="absolute z-50 mt-1 w-full rounded-md border shadow-lg"
                                style={{
                                    background: "var(--gray2)",
                                    borderColor: "var(--gray6)",
                                }}
                            >
                                {variables.map((variable, index) => (
                                    <div
                                        key={variable}
                                        className="px-3 py-2 cursor-pointer transition-colors"
                                        style={{
                                            color: "var(--gray12)",
                                            background: activeMenuIndex === index ? "var(--gray4)" : "transparent",
                                        }}
                                        onMouseEnter={() => setActiveMenuIndex(index)}
                                        onClick={() => insertVariable(variable)}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <div className="font-medium">{variable}</div>
                                            <div className="text-xs opacity-70">
                                                {variable === 'query' ? '代表查询内容' : '代表选中的文本（粘贴板内容）'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="text-xs mt-1" style={{color: 'var(--gray11)'}}>
                            支持变量：输入 {'{'} 选择变量，例如 {'{query}'} 或 {'{selection}'}
                        </p>
                    </div>

                    {/* Name input */}
                    <div>
                        <Label className="block text-sm font-medium mb-2" style={{color: 'var(--gray12)'}}>
                            名称 <span style={{color: 'var(--red9)'}}>*</span>
                        </Label>
                        <Input
                            ref={nameInputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：Google 搜索"
                            className="w-full px-3 py-2 rounded-md border outline-none transition-colors duration-200 focus:ring-2"
                            style={{
                                background: "var(--gray3)",
                                borderColor: "var(--gray7)",
                                color: "var(--gray12)",
                            }}
                        />
                    </div>
                </div>
            </div>

            <Footer
                current={null}
                icon={<Icon icon="tabler:link-plus" style={{fontSize: "20px"}}/>}
                actions={() => []}
                content={() => <div/>}
                rightElement={<button
                    onClick={handleSubmit}
                    disabled={!name.trim() || !url.trim()}
                    tabIndex={0}
                    className="px-4 py-1.5 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    style={{
                        background: !name.trim() || !url.trim() ? "var(--gray7)" : "var(--blue9)",
                        color: !name.trim() || !url.trim() ? "var(--gray11)" : "white",
                        fontSize: "13px",
                    }}
                >
                    <span>{editingId ? "更新快捷指令" : "创建快捷指令"}</span>
                    <span className="text-xs opacity-70" style={{fontSize: "11px"}}>⌃↵</span>
                </button>
                }
            />
        </>
    );
}
