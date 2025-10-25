import {useMemo} from "react";
import {Action} from "../command";

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
            perform: async () => {
                // This will be handled by setting rootActionId
                // The actual translation view will be shown in Home component
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
    }, []);
}
