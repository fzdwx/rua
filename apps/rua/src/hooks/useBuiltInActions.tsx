import {useMemo, useEffect} from "react";
import {Icon} from "@iconify/react";
import {Action, ActionId} from "@/command";
import {useActionUsage} from "@/hooks/useActionUsage";
import {getTranslateAction} from "@/components/translate";
import {getWeatherAction} from "@/components/weather";
import {getQuickLinkActions} from "@/components/quick-link";
import {useQuickLinks} from "@/hooks/useQuickLinks";
import {pluginManagerId} from "@/home/viewConfig";

/**
 * Custom hook to provide built-in actions
 * These are static actions that don't depend on search input
 */
export function useBuiltInActions(
    setRootActionId: (rootActionId: (ActionId | null)) => void,
    refreshKey: number = 0 // Used to force refresh when quick links are updated
): Action[] {
    const {getUsageCount, incrementUsage} = useActionUsage();
    const {quickLinks, deleteQuickLink, refreshQuickLinks} = useQuickLinks();

    // Reload quick links from localStorage when refreshKey changes
    useEffect(() => {
        if (refreshKey > 0) {
            refreshQuickLinks();
        }
    }, [refreshKey, refreshQuickLinks]);

    return useMemo(() => {
        const actions: Action[] = [];

        // Translation action - enters translation mode
        actions.push(getTranslateAction(getUsageCount, incrementUsage));

        // Weather action - get current weather
        actions.push(getWeatherAction(getUsageCount, incrementUsage));

        // Quick link actions - creator and user-created quick links
        actions.push(...getQuickLinkActions(
            quickLinks,
            getUsageCount,
            incrementUsage,
            setRootActionId,
            deleteQuickLink
        ));

        // Plugin manager action
        actions.push({
            id: pluginManagerId,
            name: "Manage Plugins",
            keywords: "plugins extensions addons settings",
            icon: <Icon icon="tabler:puzzle" style={{fontSize: "20px"}} />,
            subtitle: "View and manage installed plugins",
            section: "Settings",
            usageCount: getUsageCount(pluginManagerId),
            perform: () => {
                incrementUsage(pluginManagerId);
                setRootActionId(pluginManagerId);
            },
        });

        // TODO: Add more built-in actions here
        // - Base64 encode/decode
        // - JSON formatter
        // - URL encode/decode
        // - Hash functions (MD5, SHA)
        // - Color converter
        // etc.

        return actions;
    }, [getUsageCount, incrementUsage, quickLinks, setRootActionId, deleteQuickLink, refreshKey]);
}
