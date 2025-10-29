import * as React from "react";
import {useQuickLinks} from "@/hooks/useQuickLinks";
import {Footer} from "@/command";
import {Icon} from "@iconify/react";
import {useKeyPress} from "ahooks";

interface QuickLinkCreatorProps {
    onLoadingChange?: (loading: boolean) => void;
}

/**
 * QuickLinkCreator component - for creating and managing quick links
 */
export function QuickLinkCreator({onLoadingChange}: QuickLinkCreatorProps) {
    const {addQuickLink, updateQuickLink} = useQuickLinks();
    const [editingId, setEditingId] = React.useState<string | null>(null);

    const [name, setName] = React.useState("");
    const [url, setUrl] = React.useState("");
    const [icon, setIcon] = React.useState("🔗");
    const [keywords, setKeywords] = React.useState("");
    const [subtitle, setSubtitle] = React.useState("");

    // Ref for auto-focus
    const nameInputRef = React.useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    React.useEffect(() => {
        nameInputRef.current?.focus();
    }, []);

    // Add Ctrl+Enter shortcut
    useKeyPress('ctrl.enter', (e) => {
        e.preventDefault();
        handleSubmit();
    });

    // Reset form
    const resetForm = () => {
        setName("");
        setUrl("");
        setIcon("🔗");
        setKeywords("");
        setSubtitle("");
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
                    icon: icon.trim() || undefined,
                    keywords: keywords.trim() || undefined,
                    subtitle: subtitle.trim() || undefined,
                });
            } else {
                // Create new
                addQuickLink({
                    name: name.trim(),
                    url: url.trim(),
                    icon: icon.trim() || undefined,
                    keywords: keywords.trim() || undefined,
                    subtitle: subtitle.trim() || undefined,
                });
            }

            resetForm();
        } catch (err) {
            console.error("Failed to save quick link:", err);
        } finally {
            onLoadingChange?.(false);
        }
    };

    return (
        <>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Form */}
                <div className="rounded-lg border p-5 space-y-4"
                     style={{background: 'var(--gray2)', borderColor: 'var(--gray6)'}}>
                    {/* Name input */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{color: 'var(--gray12)'}}>
                            名称 <span style={{color: 'var(--red9)'}}>*</span>
                        </label>
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：GitHub"
                            className="w-full px-3 py-2 rounded-md border outline-none transition-colors duration-200 focus:ring-2"
                            style={{
                                background: "var(--gray3)",
                                borderColor: "var(--gray7)",
                                color: "var(--gray12)",
                            }}
                        />
                    </div>

                    {/* URL input */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{color: 'var(--gray12)'}}>
                            链接地址 <span style={{color: 'var(--red9)'}}>*</span>
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://github.com"
                            className="w-full px-3 py-2 rounded-md border outline-none transition-colors duration-200 focus:ring-2"
                            style={{
                                background: "var(--gray3)",
                                borderColor: "var(--gray7)",
                                color: "var(--gray12)",
                            }}
                        />
                    </div>

                    {/* Icon and Subtitle in a row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Icon input */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{color: 'var(--gray12)'}}>
                                图标（Emoji）
                            </label>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                placeholder="🔗"
                                maxLength={2}
                                className="w-full px-3 py-2 rounded-md border outline-none transition-colors duration-200 text-2xl text-center focus:ring-2"
                                style={{
                                    background: "var(--gray3)",
                                    borderColor: "var(--gray7)",
                                    color: "var(--gray12)",
                                }}
                            />
                        </div>

                        {/* Subtitle input */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{color: 'var(--gray12)'}}>
                                描述
                            </label>
                            <input
                                type="text"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                placeholder="快速访问 GitHub"
                                className="w-full px-3 py-2 rounded-md border outline-none transition-colors duration-200 focus:ring-2"
                                style={{
                                    background: "var(--gray3)",
                                    borderColor: "var(--gray7)",
                                    color: "var(--gray12)",
                                }}
                            />
                        </div>
                    </div>

                    {/* Keywords input */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{color: 'var(--gray12)'}}>
                            关键词（用于搜索）
                        </label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="git hub code repository"
                            className="w-full px-3 py-2 rounded-md border outline-none transition-colors duration-200 focus:ring-2"
                            style={{
                                background: "var(--gray3)",
                                borderColor: "var(--gray7)",
                                color: "var(--gray12)",
                            }}
                        />
                        <p className="text-xs mt-1" style={{color: 'var(--gray11)'}}>
                            用空格分隔多个关键词
                        </p>
                    </div>
                </div>
            </div>

            <Footer
                current={null}
                icon={<Icon icon="tabler:link-plus" style={{fontSize: "20px"}}/>}
                actions={() => []}
                content={() => <div/>}
                rightElement={ <button
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
