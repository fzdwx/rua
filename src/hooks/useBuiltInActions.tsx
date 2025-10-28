import {useMemo} from "react";
import {Action} from "@/command";
import {Icon} from "@iconify/react";
import {useActionUsage} from "@/hooks/useActionUsage";

/**
 * Custom hook to provide built-in actions
 * These are static actions that don't depend on search input
 */
export function useBuiltInActions(): Action[] {
    const { getUsageCount, incrementUsage } = useActionUsage();

    return useMemo(() => {
        const actions: Action[] = [];

        const translateId = "built-in-translate";
        const translateUsageCount = getUsageCount(translateId);

        // Translation action - enters translation mode
        actions.push({
            id: translateId,
            name: "Translate",
            subtitle: "Translate text between Chinese and English",
            keywords: "translate 翻译 tr",
            icon: <div style={{fontSize: "20px"}}>🌐</div>,
            kind: "built-in",
            query: true,  // Enable query input for this action
            usageCount: translateUsageCount,
            badge: "Command",
            // Footer actions specific to translate
            footerAction: (changeVisible) => [
                {
                    id: "translate-settings",
                    name: "Translation Settings",
                    subtitle: "Configure translation preferences",
                    icon: <Icon icon="tabler:settings" style={{fontSize: "20px"}} />,
                    keywords: "settings config translation",
                    perform: () => {
                        incrementUsage("translate-settings");
                        console.log("Open translation settings");
                        changeVisible();
                    },
                },
                {
                    id: "translate-history",
                    name: "Translation History",
                    subtitle: "View recent translations",
                    icon: <Icon icon="tabler:history" style={{fontSize: "20px"}} />,
                    keywords: "history recent translations",
                    perform: () => {
                        incrementUsage("translate-history");
                        console.log("Open translation history");
                        changeVisible();
                    },
                },
            ],
            // Track usage when entering translate mode
            perform: () => {
                incrementUsage(translateId);
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
    }, [getUsageCount, incrementUsage]);
}
