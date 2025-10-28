import {useMemo} from "react";
import {Action} from "@/command";
import {useActionUsage} from "@/hooks/useActionUsage";
import {getTranslateAction} from "@/components/translate";

/**
 * Custom hook to provide built-in actions
 * These are static actions that don't depend on search input
 */
export function useBuiltInActions(): Action[] {
    const {getUsageCount, incrementUsage} = useActionUsage();

    return useMemo(() => {
        const actions: Action[] = [];

        // Translation action - enters translation mode
        actions.push(getTranslateAction(getUsageCount, incrementUsage));

        // TODO: Add more built-in actions here
        // - Base64 encode/decode
        // - JSON formatter
        // - URL encode/decode
        // - Hash functions (MD5, SHA)
        // - Color converter
        // etc.

        return actions;
    }, [getUsageCount, incrementUsage]);
}
