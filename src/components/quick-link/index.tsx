import {Action, ActionId} from "@/command";
import {QuickLink} from "@/hooks/useQuickLinks";
import {Icon} from "@iconify/react";
import {QuickLinkCreator} from "@/components/quick-link/QuickLinkCreateor.tsx";
import {QuickLinkView} from "@/components/quick-link/QuickLinkView.tsx";

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
            setRootActionId(quickLinkCreatorId)
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

export {QuickLinkCreator, QuickLinkView}