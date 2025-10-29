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
    const [editingId, setEditingId] = React.useState<string | null>(null);

    const [name, setName] = React.useState("");
    const [url, setUrl] = React.useState("");
    const [icon, setIcon] = React.useState("🔗");
    const [keywords, setKeywords] = React.useState("");
    const [subtitle, setSubtitle] = React.useState("");
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState(false);

    // Ref for auto-focus
    const nameInputRef = React.useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    React.useEffect(() => {
        nameInputRef.current?.focus();
    }, []);

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
        // Scroll to top and focus
        nameInputRef.current?.focus();
        nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <div className="h-full overflow-auto p-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center pb-4 border-b" style={{borderColor: 'var(--gray6)'}}>
                    <h2 className="text-xl font-semibold mb-1" style={{color: 'var(--gray12)'}}>
                        {editingId ? '编辑快捷指令' : '创建快捷指令'}
                    </h2>
                    <p className="text-sm" style={{color: 'var(--gray11)'}}>
                        添加常用网站链接，快速访问
                    </p>
                </div>

                {/* Success Message */}
                {success && (
                    <div
                        className="flex items-center gap-3 p-3 rounded-lg border animate-in fade-in duration-200"
                        style={{
                            background: 'var(--green3)',
                            borderColor: 'var(--green6)',
                            color: 'var(--green11)'
                        }}
                    >
                        <Icon icon="tabler:check-circle" style={{fontSize: "20px"}} />
                        <span className="text-sm font-medium">
                            {editingId ? '更新成功！' : '创建成功！'}
                        </span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div
                        className="flex items-center gap-3 p-3 rounded-lg border animate-in fade-in duration-200"
                        style={{
                            background: 'var(--red3)',
                            borderColor: 'var(--red6)',
                            color: 'var(--red11)'
                        }}
                    >
                        <Icon icon="tabler:alert-circle" style={{fontSize: "20px"}} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Form */}
                <div className="rounded-lg border p-5 space-y-4" style={{background: 'var(--gray2)', borderColor: 'var(--gray6)'}}>
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

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => {
                                resetForm();
                            }}
                            className="flex-1 px-4 py-2.5 rounded-md font-medium transition-colors duration-200 hover:opacity-80"
                            style={{
                                background: "var(--gray4)",
                                color: "var(--gray11)",
                            }}
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!name.trim() || !url.trim()}
                            className="flex-1 px-4 py-2.5 rounded-md font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: "var(--accent9)",
                                color: "white",
                            }}
                        >
                            {editingId ? "更新" : "创建"}
                        </button>
                    </div>
                </div>

                {/* Quick Links List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-semibold" style={{color: 'var(--gray12)'}}>
                            已创建的快捷指令 ({quickLinks.length})
                        </h3>
                    </div>

                    {quickLinks.length === 0 ? (
                        <div className="text-center py-12 rounded-lg border" style={{background: 'var(--gray2)', borderColor: 'var(--gray6)'}}>
                            <div className="text-4xl mb-3">🔗</div>
                            <p className="text-sm" style={{color: 'var(--gray11)'}}>
                                暂无快捷指令，点击上方创建
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {quickLinks.map((link) => (
                                <div
                                    key={link.id}
                                    className="flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm group"
                                    style={{
                                        background: 'var(--gray2)',
                                        borderColor: 'var(--gray6)',
                                    }}
                                >
                                    {/* Icon */}
                                    <div className="text-2xl flex-shrink-0">
                                        {link.icon || '🔗'}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium mb-0.5" style={{color: 'var(--gray12)'}}>
                                            {link.name}
                                        </div>
                                        <div className="text-sm truncate" style={{color: 'var(--gray11)'}}>
                                            {link.url}
                                        </div>
                                        {link.subtitle && (
                                            <div className="text-xs mt-1" style={{color: 'var(--gray10)'}}>
                                                {link.subtitle}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={() => handleEdit(link)}
                                            className="p-2 rounded-md transition-colors duration-200"
                                            style={{
                                                background: 'var(--gray4)',
                                                color: 'var(--gray11)',
                                            }}
                                            title="编辑"
                                        >
                                            <Icon icon="tabler:edit" style={{fontSize: "18px"}} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(link.id)}
                                            className="p-2 rounded-md transition-colors duration-200"
                                            style={{
                                                background: 'var(--red4)',
                                                color: 'var(--red11)',
                                            }}
                                            title="删除"
                                        >
                                            <Icon icon="tabler:trash" style={{fontSize: "18px"}} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
