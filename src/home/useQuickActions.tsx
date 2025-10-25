import {useMemo} from "react";
import {Action} from "../command";

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

/**
 * Custom hook to generate quick actions based on search input
 */
export function useQuickActions(search: string): Action[] {
    return useMemo(() => {
        if (!search.trim()) {
            return [];
        }

        const actions: Action[] = [];
        const trimmedSearch = search.trim();
        const lowerSearch = trimmedSearch.toLowerCase();

        // Check for built-in functions
        for (const [funcName, funcImpl] of Object.entries(builtInFunctions)) {
            if (lowerSearch === funcName.toLowerCase()) {
                const result = funcImpl();
                actions.push({
                    id: `builtin-${funcName}`,
                    name: result,
                    subtitle: `Result of ${funcName}`,
                    keywords: funcName,
                    icon: <div style={{fontSize: "20px"}}>⚡</div>,
                    kind: "quick-action",
                    perform: async () => {
                        // Copy to clipboard
                        await navigator.clipboard.writeText(result);
                    },
                });
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

                actions.push({
                    id: `calc-${trimmedSearch}`,
                    name: formattedResult,
                    subtitle: `Result of ${trimmedSearch}`,
                    keywords: trimmedSearch,
                    icon: <div style={{fontSize: "20px"}}>🔢</div>,
                    kind: "calculation",
                    perform: async () => {
                        // Copy to clipboard
                        await navigator.clipboard.writeText(formattedResult);
                    },
                });
            }
        }

        return actions;
    }, [search]);
}
