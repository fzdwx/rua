import * as React from "react";
import {Action, ActionId, ActionImpl, useActionStore} from "@/command";
import {useQuickLinks, QuickLink} from "@/hooks/useQuickLinks";
import {openUrl} from "@tauri-apps/plugin-opener";
import {Icon} from "@iconify/react";
import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {useMemo} from "react";

export const quickLinkCreatorId = "built-in-quickLinkCreator";
export const quickLinkViewPrefix = "quick-link-view-";

/**
 * Get quick link actions including creator and all user-created quick links
 */
export function getQuickLinkActions(
    quickLinks: QuickLink[],
    getUsageCount: (actionId: ActionId) => number,
    incrementUsage: (actionId: ActionId) => void,
    setRootActionId: (rootActionId: (ActionId | null)) => void): Action[] {
    const actions: Action[] = [];

    // Add quick link creator action
    const creatorUsageCount = getUsageCount(quickLinkCreatorId);
    actions.push({
        id: quickLinkCreatorId,
        name: "创建快捷指令",
        subtitle: "创建和管理快捷指令",
        icon: <Icon icon="tabler:link-plus" style={{fontSize: "20px"}}/>,
        keywords: "create quick link 创建 快捷 指令 链接 管理",
        kind: "built-in",
        query: false,
        usageCount: creatorUsageCount,
        badge: "Quick Link",
        perform: () => {
            incrementUsage(quickLinkCreatorId);
        },
    });

    // Add all user-created quick links - these will open QuickLinkView
    quickLinks.forEach((link) => {
        const actionId = `${quickLinkViewPrefix}${link.id}`;
        const usageCount = getUsageCount(actionId);
        actions.push({
            id: actionId,
            name: link.name,
            subtitle: link.subtitle || link.url,
            icon: link.icon ? (
                <div style={{fontSize: "20px"}}>{link.icon}</div>
            ) : (
                <Icon icon="tabler:link" style={{fontSize: "20px"}}/>
            ),
            keywords: link.keywords || "",
            kind: "quick-link",
            query: false, // Enable query mode to allow input
            usageCount,
            badge: "Quick Link",
            perform: () => {
                setRootActionId(actionId)
                incrementUsage(actionId);
            },
            item: link, // Pass the link data to the view
        });
    });

    return actions;
}

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
        <div className="p-4">
            <div className="mb-4">
                <div className="text-lg font-semibold mb-2" style={{color: "var(--gray12)"}}>
                    快捷指令管理
                </div>
                <div className="text-sm" style={{color: "var(--gray11)"}}>
                    创建和管理您的快捷指令
                </div>
            </div>

            {success && (
                <div
                    className="mb-4 p-3 rounded-lg border"
                    style={{
                        background: "var(--green3)",
                        borderColor: "var(--green6)",
                        color: "var(--green11)",
                    }}
                >
                    ✓ {editingId ? "更新成功！" : "创建成功！"}
                </div>
            )}

            {!isCreating ? (
                <>
                    {/* List of existing quick links */}
                    <div className="mb-4 space-y-2">
                        {quickLinks.length === 0 ? (
                            <div
                                className="text-center py-8 text-sm"
                                style={{color: "var(--gray11)"}}
                            >
                                还没有快捷指令，点击下方按钮创建一个
                            </div>
                        ) : (
                            quickLinks.map((link) => (
                                <div
                                    key={link.id}
                                    className="p-3 rounded-lg border flex items-center justify-between"
                                    style={{
                                        background: "var(--gray3)",
                                        borderColor: "var(--gray6)",
                                    }}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div style={{fontSize: "20px"}}>
                                            {link.icon || "🔗"}
                                        </div>
                                        <div className="flex-1">
                                            <div
                                                className="font-medium"
                                                style={{color: "var(--gray12)"}}
                                            >
                                                {link.name}
                                            </div>
                                            <div
                                                className="text-sm"
                                                style={{color: "var(--gray11)"}}
                                            >
                                                {link.subtitle || link.url}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(link)}
                                            className="p-2 rounded hover:bg-gray-4"
                                            style={{color: "var(--gray11)"}}
                                        >
                                            <Icon icon="tabler:edit" style={{fontSize: "16px"}}/>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(link.id)}
                                            className="p-2 rounded hover:bg-gray-4"
                                            style={{color: "var(--red11)"}}
                                        >
                                            <Icon icon="tabler:trash" style={{fontSize: "16px"}}/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Create new button */}
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full px-4 py-2 rounded-md font-medium"
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
                        <Icon icon="tabler:plus" style={{fontSize: "16px", display: "inline", marginRight: "4px"}}/>
                        创建新快捷指令
                    </button>
                </>
            ) : (
                <>
                    {/* Create/Edit form */}
                    {error && (
                        <div
                            className="mb-4 p-3 rounded-lg border"
                            style={{
                                background: "var(--red3)",
                                borderColor: "var(--red6)",
                                color: "var(--red11)",
                            }}
                        >
                            {error}
                        </div>
                    )}

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
                </>
            )}
        </div>
    );
}

interface QuickLinkViewProps {
    quickLink: QuickLink;
    search: string;
    onLoadingChange?: (loading: boolean) => void;
}

/**
 * QuickLinkView component - for executing quick link with optional parameters
 */
export function QuickLinkView({quickLink, search, onLoadingChange}: QuickLinkViewProps) {
    console.log(quickLink)
    return <div>test</div>
    // const [finalUrl, setFinalUrl] = React.useState(quickLink.url);
    // const [isLoading, setIsLoading] = React.useState(false);
    //
    // // Update URL when search changes (in case there are parameters)
    // React.useEffect(() => {
    //     // If search is not empty and URL contains placeholders, replace them
    //     if (search.trim()) {
    //         // Simple parameter replacement: {query} or {0}, {1}, etc.
    //         let url = quickLink.url;
    //
    //         // Replace {query} with the search text
    //         url = url.replace(/\{query\}/g, encodeURIComponent(search));
    //
    //         // Replace {0}, {1}, etc. with space-separated parts
    //         const parts = search.split(/\s+/);
    //         parts.forEach((part, index) => {
    //             url = url.replace(new RegExp(`\\{${index}\\}`, 'g'), encodeURIComponent(part));
    //         });
    //
    //         setFinalUrl(url);
    //     } else {
    //         setFinalUrl(quickLink.url);
    //     }
    // }, [search, quickLink.url]);
    //
    // const handleOpen = async () => {
    //     setIsLoading(true);
    //     onLoadingChange?.(true);
    //
    //     try {
    //         await openUrl(finalUrl);
    //         // Hide window after opening link
    //         await getCurrentWebviewWindow().hide();
    //     } catch (error) {
    //         console.error("Failed to open link:", error);
    //     } finally {
    //         setIsLoading(false);
    //         onLoadingChange?.(false);
    //     }
    // };
    //
    // // Auto-open if URL doesn't contain placeholders and no search input
    // React.useEffect(() => {
    //     const hasPlaceholders = /\{(query|\d+)\}/.test(quickLink.url);
    //     if (!hasPlaceholders && !search.trim()) {
    //         handleOpen();
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []); // Only run once on mount
    //
    // const hasPlaceholders = /\{(query|\d+)\}/.test(quickLink.url);
    //
    // return (
    //     <div className="p-4">
    //         <div className="mb-4">
    //             <div className="flex items-center gap-3 mb-2">
    //                 <div style={{fontSize: "24px"}}>
    //                     {quickLink.icon || "🔗"}
    //                 </div>
    //                 <div>
    //                     <div className="text-lg font-semibold" style={{color: "var(--gray12)"}}>
    //                         {quickLink.name}
    //                     </div>
    //                     {quickLink.subtitle && (
    //                         <div className="text-sm" style={{color: "var(--gray11)"}}>
    //                             {quickLink.subtitle}
    //                         </div>
    //                     )}
    //                 </div>
    //             </div>
    //         </div>
    //
    //         {/* Show URL preview */}
    //         <div
    //             className="mb-4 p-3 rounded-lg border"
    //             style={{
    //                 background: "var(--gray3)",
    //                 borderColor: "var(--gray6)",
    //             }}
    //         >
    //             <div className="text-xs mb-1" style={{color: "var(--gray11)"}}>
    //                 将要打开的链接:
    //             </div>
    //             <div
    //                 className="text-sm font-mono break-all"
    //                 style={{color: "var(--gray12)"}}
    //             >
    //                 {finalUrl}
    //             </div>
    //         </div>
    //
    //         {hasPlaceholders && (
    //             <div
    //                 className="mb-4 p-3 rounded-lg border"
    //                 style={{
    //                     background: "var(--blue3)",
    //                     borderColor: "var(--blue6)",
    //                     color: "var(--blue11)",
    //                 }}
    //             >
    //                 <div className="text-sm">
    //                     💡 提示: 在搜索框中输入参数，系统会自动替换链接中的占位符
    //                 </div>
    //                 <div className="text-xs mt-1" style={{opacity: 0.8}}>
    //                     支持的占位符: {"{query}"} (完整输入), {"{0}"} {"{1}"} (空格分隔的参数)
    //                 </div>
    //             </div>
    //         )}
    //
    //         {/* Open button */}
    //         <button
    //             onClick={handleOpen}
    //             disabled={isLoading}
    //             className="w-full px-4 py-2 rounded-md font-medium"
    //             style={{
    //                 background: isLoading ? "var(--gray6)" : "var(--accent9)",
    //                 color: "white",
    //                 cursor: isLoading ? "not-allowed" : "pointer",
    //             }}
    //             onMouseEnter={(e) => {
    //                 if (!isLoading) {
    //                     e.currentTarget.style.background = "var(--accent10)";
    //                 }
    //             }}
    //             onMouseLeave={(e) => {
    //                 if (!isLoading) {
    //                     e.currentTarget.style.background = "var(--accent9)";
    //                 }
    //             }}
    //         >
    //             {isLoading ? "打开中..." : "打开链接"}
    //         </button>
    //     </div>
    // );
}
