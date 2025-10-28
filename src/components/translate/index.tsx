import * as React from "react";
import {translate, Language} from "./google.tsx";
import {Action, ActionId} from "@/command";

interface TranslateViewProps {
    search: string;
    onLoadingChange?: (loading: boolean) => void;
}

/**
 * Detect if text contains Chinese characters
 */
function containsChinese(text: string): boolean {
    return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Translate text using Google Translate API with optional proxy
 */
async function translateText(text: string): Promise<string | any> {
    const isChinese = containsChinese(text);

    // Determine source and target languages
    const from = isChinese ? Language.zh_cn : Language.en;
    const to = isChinese ? Language.en : Language.zh_cn;

    try {
        const result = await translate(text, from, to);
        return result;
    } catch (error) {
        console.error("Translation error:", error);
        throw error;
    }
}

export const translateId = "built-in-translate";

export function getTranslateAction(getUsageCount: (actionId: ActionId) => number, incrementUsage: (actionId: ActionId) => void): Action {
    const translateUsageCount = getUsageCount(translateId);
    return {
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
        // footerAction: (changeVisible) => [
        // {
        //     id: "translate-settings",
        //     name: "Translation Settings",
        //     subtitle: "Configure translation preferences",
        //     icon: <Icon icon="tabler:settings" style={{fontSize: "20px"}} />,
        //     keywords: "settings config translation",
        //     perform: () => {
        //         incrementUsage("translate-settings");
        //         changeVisible();
        //     },
        // },
        // {
        //     id: "translate-history",
        //     name: "Translation History",
        //     subtitle: "View recent translations",
        //     icon: <Icon icon="tabler:history" style={{fontSize: "20px"}} />,
        //     keywords: "history recent translations",
        //     perform: () => {
        //         incrementUsage("translate-history");
        //         changeVisible();
        //     },
        // },
        // ],
        // Track usage when entering translate mode
        perform: () => {
            incrementUsage(translateId);
        },
    }
}

export function TranslateView({search, onLoadingChange}: TranslateViewProps) {
    const [translationResult, setTranslationResult] = React.useState<{
        original: string;
        translated: string;
        fromLang: string;
        toLang: string;
        error?: string;
    } | null>(null);

    // Translate with Google Translate API
    React.useEffect(() => {
        if (!search.trim()) {
            setTranslationResult(null);
            onLoadingChange?.(false);
            return;
        }

        // Start loading
        onLoadingChange?.(true);

        const isChinese = containsChinese(search);

        // Call async translation
        let cancelled = false;
        translateText(search)
            .then((result) => {
                if (!cancelled) {
                    // Handle different result types
                    let translated: string;

                    if (typeof result === 'string') {
                        // Simple translation mode
                        translated = result;
                    } else if (result.explanations) {
                        // Dictionary mode - format the explanations
                        translated = result.explanations
                            .map((exp: any) => `${exp.trait}: ${exp.explains.join(', ')}`)
                            .join('\n');
                    } else {
                        translated = String(result);
                    }

                    setTranslationResult({
                        original: search,
                        translated,
                        fromLang: isChinese ? "中文" : "English",
                        toLang: isChinese ? "English" : "中文",
                    });
                    onLoadingChange?.(false);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    console.error("Translation failed:", error);
                    setTranslationResult({
                        original: search,
                        translated: "",
                        fromLang: isChinese ? "中文" : "English",
                        toLang: isChinese ? "English" : "中文",
                        error: "Translation failed. Please try again.",
                    });
                    onLoadingChange?.(false);
                }
            });

        return () => {
            cancelled = true;
            onLoadingChange?.(false);
        };
    }, [search, onLoadingChange]);

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
        }
    };

    if (!translationResult) {
        return (
            <div className="py-10 px-5 text-center text-sm" style={{color: 'var(--gray11)'}}>
                Type something to translate...
            </div>
        );
    }

    // Show error if translation failed
    if (translationResult.error) {
        return (
            <div className="p-3">
                <div
                    className="p-4 my-2 rounded-lg border"
                    style={{
                        background: 'var(--gray3)',
                        borderColor: 'var(--gray6)',
                    }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">⚠️</div>
                        <div className="text-xs" style={{color: 'var(--gray11)'}}>
                            Translation Error
                        </div>
                    </div>

                    <div className="text-sm font-semibold mb-2" style={{color: 'var(--gray12)'}}>
                        {translationResult.error}
                    </div>

                    <div className="text-[13px] mt-2" style={{color: 'var(--gray11)'}}>
                        Original: {translationResult.original}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3">
            {/* Translation result card */}
            <div
                onClick={() => handleCopy(translationResult.translated)}
                className="p-4 my-2 rounded-lg border cursor-pointer transition-all duration-200"
                style={{
                    background: 'var(--gray3)',
                    borderColor: 'var(--gray6)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--gray4)";
                    e.currentTarget.style.borderColor = "var(--gray7)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--gray3)";
                    e.currentTarget.style.borderColor = "var(--gray6)";
                }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">🌐</div>
                    <div className="text-xs" style={{color: 'var(--gray11)'}}>
                        {translationResult.fromLang} → {translationResult.toLang}
                    </div>
                </div>

                <div
                    className="text-lg font-semibold mb-2 whitespace-pre-wrap"
                    style={{color: 'var(--gray12)'}}
                >
                    {translationResult.translated}
                </div>

                <div className="text-[13px] mt-2" style={{color: 'var(--gray11)'}}>
                    Original: {translationResult.original}
                </div>

                <div
                    className="text-[11px] mt-3 px-2 py-1 rounded inline-block"
                    style={{
                        color: 'var(--gray10)',
                        background: 'var(--gray5)',
                    }}
                >
                    Click to copy translation
                </div>
            </div>
        </div>
    );
}
