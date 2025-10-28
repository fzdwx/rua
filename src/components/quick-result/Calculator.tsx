import {useMemo} from "react";

interface CalculatorProps {
    expression: string;
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
export function isMathExpression(input: string): boolean {
    // Must contain at least one operator and one digit
    return /\d/.test(input) && /[+\-*/%^]/.test(input);
}

export function Calculator({expression}: CalculatorProps) {
    const result = useMemo(() => {
        if (!isMathExpression(expression)) {
            return null;
        }

        const calculatedResult = evaluateMathExpression(expression);
        if (calculatedResult === null) {
            return null;
        }

        // Format the result
        const formattedResult = Number.isInteger(calculatedResult)
            ? calculatedResult.toString()
            : calculatedResult.toFixed(6).replace(/\.?0+$/, "");

        return formattedResult;
    }, [expression]);

    if (!result) {
        return null;
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result);
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
                <div style={{fontSize: "24px"}}>🔢</div>
                <div style={{flex: 1}}>
                    <div
                        style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            color: "var(--gray12)",
                            marginBottom: "4px",
                        }}
                    >
                        {result}
                    </div>
                    <div
                        style={{
                            fontSize: "12px",
                            color: "var(--gray11)",
                        }}
                    >
                        = {expression}
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
