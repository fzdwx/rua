import * as React from "react";
import {translate, Language} from "./Google.tsx";
import {Action, ActionId} from "@/command";
import {useKeyPress} from "ahooks";
import {Card, CardContent} from "@/components/ui/card";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Icon} from "@iconify/react";
import {motion} from "motion/react";

interface TranslateViewProps {
    search: string;
    onLoadingChange?: (loading: boolean) => void;
    onReturn?: () => void;
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
        keywords: "translate,翻译,tr",
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

export function TranslateView({search, onLoadingChange, onReturn}: TranslateViewProps) {
    const [translationResult, setTranslationResult] = React.useState<{
        original: string;
        translated: string;
        fromLang: string;
        toLang: string;
        error?: string;
    } | null>(null);

    // ESC key to return to home
    useKeyPress('esc', () => {
        onReturn?.();
    });

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
            <div className="py-10 px-5 text-center text-sm overflow-y-auto flex-1">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-3"
                >
                    <div className="text-4xl mb-2 opacity-50">🌐</div>
                    <div className="text-gray-11 font-medium">Type something to translate...</div>
                    <div className="text-xs text-gray-10">Supports Chinese ↔ English</div>
                </motion.div>
            </div>
        );
    }

    // Show error if translation failed
    if (translationResult.error) {
        return (
            <div className="p-3 overflow-y-auto flex-1">
                <Alert variant="destructive" className="my-2">
                    <Icon icon="tabler:alert-circle" className="h-4 w-4" />
                    <AlertTitle>Translation Error</AlertTitle>
                    <AlertDescription>
                        <div className="font-semibold mb-2">{translationResult.error}</div>
                        <div className="text-xs mt-2">Original: {translationResult.original}</div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-3 overflow-y-auto flex-1">
            {/* Translation result card */}
            <Card
                onClick={() => handleCopy(translationResult.translated)}
                className="my-2 cursor-pointer bg-[var(--gray3)] border-[var(--gray6)] hover:bg-[var(--gray4)] hover:border-[var(--gray7)] hover:scale-[1.01]"
            >
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">🌐</div>
                        <div className="text-xs text-gray-11">
                            {translationResult.fromLang} → {translationResult.toLang}
                        </div>
                    </div>

                    <div className="text-lg font-semibold mb-2 whitespace-pre-wrap text-gray-12">
                        {translationResult.translated}
                    </div>

                    <div className="text-[13px] mt-2 text-gray-11">
                        Original: {translationResult.original}
                    </div>

                    <div className="text-[11px] mt-3 px-2 py-1 rounded inline-block text-gray-10 bg-gray-5">
                        Click to copy translation
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
