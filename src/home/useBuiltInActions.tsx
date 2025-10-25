import {useMemo} from "react";
import {Action} from "../command";

/**
 * Detect if text contains Chinese characters
 */
function containsChinese(text: string): boolean {
    return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Mock translation function (to be replaced with real API later)
 */
function translateText(text: string): string {
    const isChinese = containsChinese(text);

    if (isChinese) {
        // Mock: Chinese to English
        return `[EN] ${text}`;
    } else {
        // Mock: English to Chinese
        return `[中文] ${text}`;
    }
}

/**
 * Custom hook to generate built-in actions based on search input
 * This hook provides various utility functions like translation, encoding, etc.
 */
export function useBuiltInActions(search: string): Action[] {
    return useMemo(() => {
        if (!search.trim()) {
            return [];
        }

        const actions: Action[] = [];
        const trimmedSearch = search.trim();
        const lowerSearch = trimmedSearch.toLowerCase();

        // Translation action
        const translationPrefixes = [
            {prefix: "tr ", display: "tr"},
            {prefix: "translate ", display: "translate"},
            {prefix: "翻译 ", display: "翻译"},
        ];

        for (const {prefix, display} of translationPrefixes) {
            if (lowerSearch.startsWith(prefix)) {
                const textToTranslate = trimmedSearch.substring(prefix.length).trim();
                if (textToTranslate) {
                    const translated = translateText(textToTranslate);
                    const isChinese = containsChinese(textToTranslate);
                    const langPair = isChinese ? "中文 → English" : "English → 中文";

                    actions.push({
                        id: `translate-${textToTranslate}`,
                        name: translated,
                        subtitle: `${display} "${textToTranslate}" (${langPair})`,
                        keywords: `translate ${textToTranslate}`,
                        icon: <div style={{fontSize: "20px"}}>🌐</div>,
                        kind: "built-in-translation",
                        perform: async () => {
                            await navigator.clipboard.writeText(translated);
                        },
                    });
                }
                break;
            }
        }

        // TODO: Add more built-in actions here
        // - Base64 encode/decode
        // - JSON formatter
        // - URL encode/decode
        // - Hash functions (MD5, SHA)
        // - Color converter
        // etc.

        return actions;
    }, [search]);
}
