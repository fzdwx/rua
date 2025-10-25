import {useMemo, useEffect} from "react";

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

export function TranslateView({search, onLoadingChange}: TranslateViewProps) {
    // Simulate loading for 2000ms when component mounts or search changes
    useEffect(() => {
        onLoadingChange?.(true);
        const timer = setTimeout(() => {
            onLoadingChange?.(false);
        }, 2000);

        return () => {
            clearTimeout(timer);
            onLoadingChange?.(false);
        };
    }, [search, onLoadingChange]);

    const translationResult = useMemo(() => {
        if (!search.trim()) {
            return null;
        }

        const isChinese = containsChinese(search);
        const translated = translateText(search);

        return {
            original: search,
            translated,
            fromLang: isChinese ? "中文" : "English",
            toLang: isChinese ? "English" : "中文",
        };
    }, [search]);

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
        }
    };

    if (!translationResult) {
        return (
            <div
                style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "var(--gray11)",
                    fontSize: "14px",
                }}
            >
                Type something to translate...
            </div>
        );
    }

    return (
        <div style={{padding: "12px"}}>
            {/* Translation result card */}
            <div
                onClick={() => handleCopy(translationResult.translated)}
                style={{
                    padding: "16px",
                    margin: "8px 0",
                    background: "var(--gray3)",
                    border: "1px solid var(--gray6)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
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
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "12px",
                    }}
                >
                    <div style={{fontSize: "24px"}}>🌐</div>
                    <div style={{fontSize: "12px", color: "var(--gray11)"}}>
                        {translationResult.fromLang} → {translationResult.toLang}
                    </div>
                </div>

                <div
                    style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "var(--gray12)",
                        marginBottom: "8px",
                    }}
                >
                    {translationResult.translated}
                </div>

                <div
                    style={{
                        fontSize: "13px",
                        color: "var(--gray11)",
                        marginTop: "8px",
                    }}
                >
                    Original: {translationResult.original}
                </div>

                <div
                    style={{
                        fontSize: "11px",
                        color: "var(--gray10)",
                        marginTop: "12px",
                        padding: "4px 8px",
                        background: "var(--gray5)",
                        borderRadius: "4px",
                        display: "inline-block",
                    }}
                >
                    Click to copy translation
                </div>
            </div>
        </div>
    );
}
