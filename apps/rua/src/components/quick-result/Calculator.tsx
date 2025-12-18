import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

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

export function Calculator({ expression }: CalculatorProps) {
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
    <Card
      onClick={handleCopy}
      className="mx-3 my-2 cursor-pointer bg-[var(--gray3)] border-[var(--gray6)] hover:bg-[var(--gray4)] hover:border-[var(--gray7)] hover:scale-[1.01]"
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🔢</div>
          <div className="flex-1">
            <div className="text-xl font-semibold text-gray-12 mb-1">{result}</div>
            <div className="text-xs text-gray-11">= {expression}</div>
          </div>
          <div className="text-[11px] text-gray-10 px-2 py-1 rounded bg-gray-5">Click to copy</div>
        </div>
      </CardContent>
    </Card>
  );
}
