import {QuickLink} from "@/hooks/useQuickLinks.tsx";

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
