import {useMemo} from "react";
import {Action, ActionId} from "@/command";
import {useActionUsage} from "@/hooks/useActionUsage";
import {getTranslateAction} from "@/components/translate";
import {getQuickLinkActions} from "@/components/quick-link";
import {useQuickLinks} from "@/hooks/useQuickLinks";

/**
 * Custom hook to provide built-in actions
 * These are static actions that don't depend on search input
 */
export function useBuiltInActions(setRootActionId: (rootActionId: (ActionId | null)) => void): Action[] {
    const {getUsageCount, incrementUsage} = useActionUsage();
    const {quickLinks} = useQuickLinks();

    return useMemo(() => {
        const actions: Action[] = [];

        // Translation action - enters translation mode
        actions.push(getTranslateAction(getUsageCount, incrementUsage));

        // Quick link actions - creator and user-created quick links
        actions.push(...getQuickLinkActions(quickLinks, getUsageCount, incrementUsage,setRootActionId));

        // TODO: Add more built-in actions here
        // - Base64 encode/decode
        // - JSON formatter
        // - URL encode/decode
        // - Hash functions (MD5, SHA)
        // - Color converter
        // etc.

        return actions;
    }, [getUsageCount, incrementUsage, quickLinks]);
}
