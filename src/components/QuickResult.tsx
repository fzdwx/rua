import {useMemo} from "react";

interface QuickResultProps {
    search: string;
}

/**
 * Safely evaluate a mathematical expression
 * Supports: +, -, *, /, %, ^, parentheses
 */
function evaluateMathExpression(expr: string): number | null {
    try {
        // Remove whitespace
        const cleaned = expr.replace(/\s/g, "");

        // Only allow numbers, operators, parentheses, and decimal points
        if (!/^[\d+\-*/%^().,]+$/.test(cleaned)) {
            return null;
        }

        // Replace ^ with ** for exponentiation
        const normalized = cleaned.replace(/\^/g, "**");

        // Use Function constructor (safer than eval, but still isolated)
        // This is acceptable for math expressions with validated input
        const result = new Function(`"use strict"; return (${normalized})`)();

        if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
            return result;
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Check if input looks like a math expression
 */
function isMathExpression(input: string): boolean {
    // Must contain at least one operator and one digit
    return /\d/.test(input) && /[+\-*/%^]/.test(input);
}

/**
 * Built-in functions
 */
const builtInFunctions: Record<string, () => string> = {
    "now()": () => {
        const now = new Date();
        return now.toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
    },
    "date()": () => {
        const now = new Date();
        return now.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
    },
    "datetime()": () => {
        const now = new Date();
        return now.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
    },
    "timestamp()": () => {
        return Date.now().toString();
    },
    "uuid()": () => {
        return crypto.randomUUID();
    },
    "random()": () => {
        return Math.random().toString();
    },
};

export function QuickResult({search}: QuickResultProps) {
    // Check if search input matches any quick result pattern
    const quickResult = useMemo(() => {
        if (!search.trim()) {
            return null;
        }

        const trimmedSearch = search.trim();
        const lowerSearch = trimmedSearch.toLowerCase();

        // Check for built-in functions
        for (const [funcName, funcImpl] of Object.entries(builtInFunctions)) {
            if (lowerSearch === funcName.toLowerCase()) {
                return {
                    type: "function" as const,
                    expression: funcName,
                    result: funcImpl(),
                    icon: "⚡",
                };
            }
        }

        // Check for math expression
        if (isMathExpression(trimmedSearch)) {
            const result = evaluateMathExpression(trimmedSearch);
            if (result !== null) {
                // Format the result
                const formattedResult = Number.isInteger(result)
                    ? result.toString()
                    : result.toFixed(6).replace(/\.?0+$/, "");

                return {
                    type: "calculation" as const,
                    expression: trimmedSearch,
                    result: formattedResult,
                    icon: "🔢",
                };
            }
        }

        return null;
    }, [search]);

    // Don't render if no quick result
    if (!quickResult) {
        return null;
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(quickResult.result);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
        }
    };

    return (
        <div
            onClick={handleCopy}
            style={{
                padding: "12px 16px",
                margin: "8px 12px",
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
                }}
            >
                <div style={{fontSize: "24px"}}>{quickResult.icon}</div>
                <div style={{flex: 1}}>
                    <div
                        style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            color: "var(--gray12)",
                            marginBottom: "4px",
                        }}
                    >
                        {quickResult.result}
                    </div>
                    <div
                        style={{
                            fontSize: "12px",
                            color: "var(--gray11)",
                        }}
                    >
                        {quickResult.type === "calculation"
                            ? `= ${quickResult.expression}`
                            : quickResult.expression}
                    </div>
                </div>
                <div
                    style={{
                        fontSize: "11px",
                        color: "var(--gray10)",
                        padding: "4px 8px",
                        background: "var(--gray5)",
                        borderRadius: "4px",
                    }}
                >
                    Click to copy
                </div>
            </div>
        </div>
    );
}

