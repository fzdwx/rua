import { useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Action, ActionId } from "@fzdwx/ruaui";
import { useActionUsage } from "@/hooks/useActionUsage";
import { getTranslateAction } from "@/components/translate";
import { getWeatherAction } from "@/components/weather";
import { getQuickLinkActions } from "@/components/quick-link";
import { useQuickLinks } from "@/hooks/useQuickLinks";
import { extensionManagerId } from "@/home/viewConfig";

/**
 * Custom hook to provide built-in actions
 * These are static actions that don't depend on search input
 */
export function useBuiltInActions(
  setRootActionId: (rootActionId: ActionId | null) => void,
  setSearch: (search: string) => void,
  refreshKey: number = 0 // Used to force refresh when quick links are updated
): Action[] {
  const { getUsageCount, incrementUsage } = useActionUsage();
  const { quickLinks, deleteQuickLink, refreshQuickLinks } = useQuickLinks();

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
    actions.push(
      ...getQuickLinkActions(
        quickLinks,
        getUsageCount,
        incrementUsage,
        setRootActionId,
        deleteQuickLink
      )
    );

    // Extension manager action
    actions.push({
      id: extensionManagerId,
      name: "Manage Extension",
      keywords: "extensions addons settings",
      icon: <Icon icon="tabler:puzzle" style={{ fontSize: "20px" }} />,
      subtitle: "View and manage installed extensions",
      section: "Settings",
      usageCount: getUsageCount(extensionManagerId),
      perform: () => {
        incrementUsage(extensionManagerId);
        // Clear search input before entering extension view
        setSearch("");
        // Use setTimeout to ensure search is cleared before setting root action
        setTimeout(() => {
          setRootActionId(extensionManagerId);
        }, 0);
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
  }, [
    getUsageCount,
    incrementUsage,
    quickLinks,
    setRootActionId,
    setSearch,
    deleteQuickLink,
    refreshKey,
  ]);
}
