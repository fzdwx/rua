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
        keywords: "create,quick,link,创建,快捷,指令,链接,管理",
        kind: "built-in",
        query: false,
        usageCount: creatorUsageCount,
        badge: "Quick Link",
        disableSearchFocus: true, // Prevent auto-focus to search box when this action is active
        perform: () => {
            setRootActionId(quickLinkCreatorId)
            incrementUsage(quickLinkCreatorId);
        },
    });

    // Add all user-created quick links - these will open QuickLinkView
    quickLinks.forEach((link) => {
        const actionId = `${quickLinkViewPrefix}${link.id}`;
        const usageCount = getUsageCount(actionId);

        // Check if the URL contains {query} variable to enable query mode
        const hasQueryVariable = link.url.includes('{query}');

        // Determine which icon to use: iconUrl > emoji icon > default icon
        let iconElement;
        if (link.iconUrl) {
            // Use fetched favicon
            iconElement = (
                <img
                    src={link.iconUrl}
                    alt={link.name}
                    style={{
                        width: "20px",
                        height: "20px",
                        objectFit: "contain"
                    }}
                />
            );
        } else if (link.icon) {
            // Use emoji or custom icon
            iconElement = <div style={{fontSize: "20px"}}>{link.icon}</div>;
        } else {
            // Default icon
            iconElement = <Icon icon="tabler:link" style={{fontSize: "20px"}}/>;
        }

        actions.push({
            id: actionId,
            name: link.name,
            subtitle: link.subtitle || link.url,
            icon: iconElement,
            keywords: link.keywords || "",
            kind: "quick-link",
            query: hasQueryVariable, // Enable query mode if URL contains {query}
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