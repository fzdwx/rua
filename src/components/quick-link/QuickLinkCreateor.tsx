import * as React from "react";
import {QuickLink, useQuickLinks} from "@/hooks/useQuickLinks";
import {Icon} from "@iconify/react";

interface QuickLinkCreatorProps {
    onLoadingChange?: (loading: boolean) => void;
}

/**
 * QuickLinkCreator component - for creating and managing quick links
 */
export function QuickLinkCreator({onLoadingChange}: QuickLinkCreatorProps) {
    const {quickLinks, addQuickLink, updateQuickLink, deleteQuickLink} = useQuickLinks();
    const [isCreating, setIsCreating] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);

    const [name, setName] = React.useState("");
    const [url, setUrl] = React.useState("");
    const [icon, setIcon] = React.useState("🔗");
    const [keywords, setKeywords] = React.useState("");
    const [subtitle, setSubtitle] = React.useState("");
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState(false);

    // Reset form
    const resetForm = () => {
        setName("");
        setUrl("");
        setIcon("🔗");
        setKeywords("");
        setSubtitle("");
        setError("");
        setEditingId(null);
    };

    // Start editing a quick link
    const handleEdit = (link: QuickLink) => {
        setEditingId(link.id);
        setName(link.name);
        setUrl(link.url);
        setIcon(link.icon || "🔗");
        setKeywords(link.keywords || "");
        setSubtitle(link.subtitle || "");
        setIsCreating(true);
    };

    // Handle delete
    const handleDelete = (id: string) => {
        if (confirm("确定要删除这个快捷指令吗？")) {
            deleteQuickLink(id);
        }
    };

    // Handle submit (create or update)
    const handleSubmit = async () => {
        // Validate inputs
        if (!name.trim()) {
            setError("请输入快捷指令名称");
            return;
        }
        if (!url.trim()) {
            setError("请输入链接地址");
            return;
        }

        // Simple URL validation
        try {
            new URL(url);
        } catch {
            setError("请输入有效的链接地址（需要包含 http:// 或 https://）");
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

            setSuccess(true);
            setError("");
            resetForm();
            setIsCreating(false);

            // Reset success message after 1 second
            setTimeout(() => {
                setSuccess(false);
            }, 1000);
        } catch (err) {
            setError(editingId ? "更新失败，请重试" : "创建失败，请重试");
            console.error("Failed to save quick link:", err);
        } finally {
            onLoadingChange?.(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Name input */}
            <div>
                <label className="block text-sm mb-1" style={{color: "var(--gray11)"}}>
                    名称 *
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：GitHub"
                    className="w-full px-3 py-2 rounded-md border outline-none"
                    style={{
                        background: "var(--gray3)",
                        borderColor: "var(--gray6)",
                        color: "var(--gray12)",
                    }}
                />
            </div>

            {/* URL input */}
            <div>
                <label className="block text-sm mb-1" style={{color: "var(--gray11)"}}>
                    链接地址 *
                </label>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com"
                    className="w-full px-3 py-2 rounded-md border outline-none"
                    style={{
                        background: "var(--gray3)",
                        borderColor: "var(--gray6)",
                        color: "var(--gray12)",
                    }}
                />
            </div>

            {/* Icon input */}
            <div>
                <label className="block text-sm mb-1" style={{color: "var(--gray11)"}}>
                    图标（Emoji）
                </label>
                <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="🔗"
                    maxLength={2}
                    className="w-full px-3 py-2 rounded-md border outline-none"
                    style={{
                        background: "var(--gray3)",
                        borderColor: "var(--gray6)",
                        color: "var(--gray12)",
                    }}
                />
            </div>

            {/* Subtitle input */}
            <div>
                <label className="block text-sm mb-1" style={{color: "var(--gray11)"}}>
                    描述
                </label>
                <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="快速访问 GitHub"
                    className="w-full px-3 py-2 rounded-md border outline-none"
                    style={{
                        background: "var(--gray3)",
                        borderColor: "var(--gray6)",
                        color: "var(--gray12)",
                    }}
                />
            </div>

            {/* Keywords input */}
            <div>
                <label className="block text-sm mb-1" style={{color: "var(--gray11)"}}>
                    关键词（用于搜索）
                </label>
                <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="git hub code"
                    className="w-full px-3 py-2 rounded-md border outline-none"
                    style={{
                        background: "var(--gray3)",
                        borderColor: "var(--gray6)",
                        color: "var(--gray12)",
                    }}
                />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => {
                        resetForm();
                        setIsCreating(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-md font-medium"
                    style={{
                        background: "var(--gray4)",
                        color: "var(--gray11)",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--gray5)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--gray4)";
                    }}
                >
                    取消
                </button>
                <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 rounded-md font-medium"
                    style={{
                        background: "var(--accent9)",
                        color: "white",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--accent10)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--accent9)";
                    }}
                >
                    {editingId ? "更新" : "创建"}
                </button>
            </div>
        </div>
    );
}
