import {Action, ActionId} from "@/command";
import {QuickLink} from "@/hooks/useQuickLinks";
import {Icon} from "@iconify/react";
import {QuickLinkCreator} from "@/components/quick-link/QuickLinkCreateor.tsx";
import {QuickLinkView} from "@/components/quick-link/QuickLinkView.tsx";

export const quickLinkCreatorId = "built-in-quickLinkCreator";
export const quickLinkViewPrefix = "quick-link-view-";
export const quickLinkEditId = "built-in-quickLinkEdit";

/**
 * Check if a string is a URL or Data URL
 */
function isUrl(str: string): boolean {
    // Check for Data URL (data:image/png;base64,...)
    if (str.startsWith('data:')) {
        return true;
    }

    // Check for regular URL
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get quick link actions including creator and all user-created quick links
 */
export function getQuickLinkActions(
    quickLinks: QuickLink[],
    getUsageCount: (actionId: ActionId) => number,
    incrementUsage: (actionId: ActionId) => void,
    setRootActionId: (rootActionId: (ActionId | null)) => void,
    deleteQuickLink: (id: string) => void): Action[] {
    const actions: Action[] = [];

    // Add quick link edit action (registered as a main action)
    // This action will be triggered from footer actions, and the link data
    // will be passed via the parent action's item property
    actions.push({
        id: quickLinkEditId,
        name: "编辑快捷指令",
        subtitle: "编辑快捷指令",
        icon: <Icon icon="tabler:edit" style={{fontSize: "20px"}}/>,
        keywords: "edit,quick,link,编辑,快捷,指令",
        kind: "built-in",
        query: false,
        hideSearchBox: true, // Hide search box when editing
        disableSearchFocus: true, // Prevent auto-focus to search box when editing
        perform: () => {
            // This will be called when the action is activated
            // The link data should be passed via item property from the parent action
            setRootActionId(quickLinkEditId);
        },
    });

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
        hideSearchBox: true, // Hide search box when this action is active
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

        // Determine which icon to use: custom icon (URL or emoji) > auto-fetched iconUrl > default icon
        let iconElement;
        if (link.icon) {
            // Check if custom icon is a URL
            if (isUrl(link.icon)) {
                // Use custom icon URL
                iconElement = (
                    <img
                        src={link.icon}
                        alt={link.name}
                        style={{
                            width: "20px",
                            height: "20px",
                            objectFit: "contain"
                        }}
                        onError={(e) => {
                            // If image fails to load, replace with default icon or favicon
                            const target = e.target as HTMLImageElement;
                            if (link.iconUrl) {
                                target.src = link.iconUrl;
                            } else {
                                target.style.display = 'none';
                            }
                        }}
                    />
                );
            } else {
                // Use emoji or custom text icon - show first character if too long
                const displayText = link.icon.length > 2 ? link.icon.substring(0, 1) : link.icon;
                iconElement = <div style={{fontSize: "20px"}}>{displayText}</div>;
            }
        } else if (link.iconUrl) {
            // Use auto-fetched favicon
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
        } else {
            // Default icon
            iconElement = <Icon icon="tabler:link" style={{fontSize: "20px"}}/>;
        }

        // Add main action with footer action for delete
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
            hideSearchBox: true, // Hide search box when viewing this quick link
            perform: () => {
                setRootActionId(actionId)
                incrementUsage(actionId);
            },
            item: link, // Pass the link data to the view
            // Footer actions for this quick link
            footerAction: (changeVisible) => {
                return [
                    {
                        id: `${actionId}-edit`,
                        name: "编辑",
                        subtitle: "编辑此快捷指令",
                        icon: <Icon icon="tabler:edit" style={{fontSize: "20px"}}/>,
                        keywords: "edit,modify,编辑,修改",
                        hideSearchBox: true, // Hide search box when editing
                        disableSearchFocus: true, // Prevent auto-focus to search box when editing
                        perform: () => {
                            // Close the popover first
                            changeVisible();

                            // Use setTimeout to ensure popover closes before state updates
                            setTimeout(() => {
                                // Switch to edit mode using registered action ID
                                // The link data will be passed via item property in the main action
                                setRootActionId(quickLinkEditId);
                            }, 100);
                        },
                        item: link, // Pass the link data to the edit action
                    },
                    {
                        id: `${actionId}-delete`,
                        name: "删除",
                        subtitle: "删除此快捷指令",
                        icon: <Icon icon="tabler:trash" style={{fontSize: "20px"}}/>,
                        keywords: "delete,remove,删除,移除",
                        perform: () => {
                            // Close the popover first
                            changeVisible();

                            // Use setTimeout to ensure popover closes before state updates
                            setTimeout(() => {
                                // Delete the quick link (useEffect will auto-save to localStorage)
                                deleteQuickLink(link.id);
                                // Return to main view
                                setRootActionId(null);
                            }, 100);
                        },
                    },
                ];
            },
        });
    });

    return actions;
}

export {QuickLinkCreator, QuickLinkView}