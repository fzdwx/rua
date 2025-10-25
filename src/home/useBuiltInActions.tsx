import {useMemo} from "react";
import {Action} from "../command";
import {Icon} from "@iconify/react";

/**
 * Custom hook to provide built-in actions
 * These are static actions that don't depend on search input
 */
export function useBuiltInActions(): Action[] {
    return useMemo(() => {
        const actions: Action[] = [];

        // Translation action - enters translation mode
        actions.push({
            id: "built-in-translate",
            name: "Translate",
            subtitle: "Translate text between Chinese and English",
            keywords: "translate 翻译 tr",
            icon: <div style={{fontSize: "20px"}}>🌐</div>,
            kind: "built-in",
            query: true,  // Enable query input for this action
            // Footer actions specific to translate
            footerAction: (changeVisible) => [
                {
                    id: "translate-settings",
                    name: "Translation Settings",
                    subtitle: "Configure translation preferences",
                    icon: <Icon icon="tabler:settings" style={{fontSize: "20px"}} />,
                    keywords: "settings config translation",
                    perform: () => {
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
                        console.log("Open translation history");
                        changeVisible();
                    },
                },
            ],
            // No perform function - this makes it enterable (navigable)
        });

        // TODO: Add more built-in actions here
        // - Base64 encode/decode
        // - JSON formatter
        // - URL encode/decode
        // - Hash functions (MD5, SHA)
        // - Color converter
        // etc.

        return actions;
    }, []);
}
