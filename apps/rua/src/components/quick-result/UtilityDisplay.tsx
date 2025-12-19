import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "../../../../../packages/rua-ui/src/components/ui/sonner";
import { Card, CardContent } from "../../../../../packages/rua-ui/src/components/ui/card";

interface UtilityDisplayProps {
  input: string;
}

interface UtilityResult {
  type: "simple";
  primary: string;
  icon: string;
  label?: string; // Optional label for context
}

interface RandConfig {
  multiplier?: number; // For rand * N
  min?: number; // For rand min,max
  max?: number; // For rand min,max
}

// Default max value when only min is specified (effectively unlimited)
const DEFAULT_RAND_MAX = 10000;

/**
 * Parse rand expression to extract configuration
 * Supports:
 * - rand * N (multiply by N)
 * - rand min,max (range from min to max)
 * - rand N, (from N to default max)
 * - rand N (from N to default max)
 * - rand (basic 0-1)
 */
function parseRandExpression(input: string): RandConfig | null {
  const trimmed = input.trim().toLowerCase();

  // Match "rand * N" or "rand*N"
  const multiplyMatch = trimmed.match(/^rand\s*\*\s*(\d+(?:\.\d+)?)$/);
  if (multiplyMatch) {
    return {
      multiplier: parseFloat(multiplyMatch[1]),
    };
  }

  // Match "rand min,max" or "rand min, max"
  const rangeMatch = trimmed.match(/^rand\s+(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (min < max) {
      return { min, max };
    }
  }

  // Match "rand N," (from N to default max)
  const singleRangeMatch = trimmed.match(/^rand\s+(\d+(?:\.\d+)?)\s*,\s*$/);
  if (singleRangeMatch) {
    const min = parseFloat(singleRangeMatch[1]);
    return { min, max: DEFAULT_RAND_MAX };
  }

  // Match "rand N" (from N to default max)
  const singleNumberMatch = trimmed.match(/^rand\s+(\d+(?:\.\d+)?)$/);
  if (singleNumberMatch) {
    const min = parseFloat(singleNumberMatch[1]);
    return { min, max: DEFAULT_RAND_MAX };
  }

  // Check if it's just "rand" or "rand()"
  if (trimmed === "rand" || trimmed === "rand()") {
    return {}; // Basic rand
  }

  return null;
}

/**
 * Generate random number based on configuration
 */
function generateRandom(config: RandConfig): UtilityResult {
  let value: number;
  let label: string | undefined;

  if (config.min !== undefined && config.max !== undefined) {
    // Range random
    value = Math.random() * (config.max - config.min) + config.min;
    label = `Random (${config.min} - ${config.max})`;
  } else if (config.multiplier !== undefined) {
    // Multiplied random
    value = Math.random() * config.multiplier;
    label = `Random × ${config.multiplier}`;
  } else {
    // Basic random
    value = Math.random();
    label = "Random (0 - 1)";
  }

  return {
    type: "simple",
    icon: "🎲",
    primary: value.toString(),
    label,
  };
}

/**
 * Built-in utility functions
 */
const utilityFunctions: Record<string, () => UtilityResult> = {
  "uuid()": () => {
    return {
      type: "simple",
      icon: "🔑",
      primary: crypto.randomUUID(),
    };
  },
  "random()": () => {
    return {
      type: "simple",
      icon: "🎲",
      primary: Math.random().toString(),
    };
  },
  "rand()": () => {
    return {
      type: "simple",
      icon: "🎲",
      primary: Math.random().toString(),
    };
  },
};

/**
 * Normalize function name to include parentheses if missing
 */
function normalizeFunctionName(input: string): string {
  const trimmed = input.trim();
  // If input doesn't end with (), add it
  if (!trimmed.endsWith("()")) {
    return `${trimmed}()`;
  }
  return trimmed;
}

/**
 * Check if input matches a utility function
 */
export function isUtilityFunction(input: string): boolean {
  const normalized = normalizeFunctionName(input.toLowerCase());

  // Check standard utility functions
  const hasStandardFunc = Object.keys(utilityFunctions).some(
    (funcName) => funcName.toLowerCase() === normalized
  );

  if (hasStandardFunc) return true;

  // Check rand expressions
  if (parseRandExpression(input) !== null) {
    return true;
  }

  return false;
}

/**
 * Get smart hints based on current input
 */
function getSmartHints(
  input: string
): Array<{ category: string; hints: Array<{ code: string; description: string }> }> {
  const trimmed = input.trim().toLowerCase();
  const hints: Array<{ category: string; hints: Array<{ code: string; description: string }> }> =
    [];

  // UUID hints
  if (trimmed.startsWith("u") || trimmed === "" || trimmed.startsWith("uuid")) {
    hints.push({
      category: "UUID 生成",
      hints: [{ code: "uuid()", description: "生成 UUID v4" }],
    });
  }

  // Random hints
  if (
    trimmed.startsWith("r") ||
    trimmed === "" ||
    trimmed.startsWith("rand") ||
    trimmed.startsWith("random")
  ) {
    const randHints: Array<{ code: string; description: string }> = [];

    // Basic rand
    if (
      trimmed === "" ||
      trimmed === "r" ||
      trimmed === "ra" ||
      trimmed === "ran" ||
      trimmed === "rand" ||
      trimmed === "random"
    ) {
      randHints.push({ code: "rand", description: "生成 0-1 之间的随机数" });
      randHints.push({ code: "random()", description: "生成 0-1 之间的随机数" });
    }

    // Multiplication syntax
    if (trimmed === "rand" || trimmed.includes("*") || trimmed.match(/^rand\s+\*?$/)) {
      randHints.push({ code: "rand * 100", description: "生成 0-100 的随机数（乘法）" });
    }

    // Single number or range syntax
    if (trimmed.match(/^rand\s+\d*$/) || trimmed.match(/^rand\s+\d+,?$/)) {
      randHints.push({ code: "rand 1", description: "从 1 开始到 10000（大范围）" });
      randHints.push({ code: "rand 1,", description: "从 1 开始到 10000（大范围）" });
    }

    // Range syntax
    if (trimmed.match(/^rand\s+\d+,\s*\d*$/) || trimmed === "rand") {
      randHints.push({ code: "rand 1,100", description: "生成 1-100 之间的随机数" });
      randHints.push({ code: "rand 0.5,10.5", description: "支持小数范围" });
    }

    if (randHints.length > 0) {
      hints.push({
        category: "随机数生成",
        hints: randHints,
      });
    }
  }

  return hints;
}

export function UtilityDisplay({ input }: UtilityDisplayProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const trimmedInput = input.trim();
  const normalized = normalizeFunctionName(trimmedInput.toLowerCase());

  // Get smart hints based on input
  const smartHints = getSmartHints(trimmedInput);

  // Check for utility functions
  let result: UtilityResult | null = null;

  // First, check standard utility functions
  for (const [funcName, funcImpl] of Object.entries(utilityFunctions)) {
    if (normalized === funcName.toLowerCase()) {
      result = funcImpl();
      break;
    }
  }

  // If no standard function matched, check rand expressions
  if (!result) {
    const randConfig = parseRandExpression(trimmedInput);
    if (randConfig !== null) {
      result = generateRandom(randConfig);
    }
  }

  if (!result) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result!.primary);
      setCopiedItem(result!.primary);
      toast.success(
        <div>
          Copied <span className="clip_hight">{result!.primary}</span> to Clipboard Success
        </div>
      );
      setTimeout(() => setCopiedItem(null), 1000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <>
      <Toaster position="bottom-center" />
      <div className="mx-3 my-2">
        {/* Main Result Card */}
        <Card
          onClick={handleCopy}
          className="cursor-pointer bg-[var(--gray3)] border-[var(--gray6)] hover:bg-[var(--gray4)] hover:border-[var(--gray7)] hover:scale-[1.01]"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{result.icon}</div>
              <div className="flex-1">
                {result.label && (
                  <div className="text-[11px] text-gray-11 mb-1">{result.label}</div>
                )}
                <div className="text-xl font-semibold text-gray-12">{result.primary}</div>
              </div>
              <div
                className={`text-[11px] px-2 py-1 rounded transition-colors duration-200 ${
                  copiedItem === result.primary
                    ? "text-green-11 bg-green-3"
                    : "text-gray-10 bg-gray-5"
                }`}
              >
                {copiedItem === result.primary ? "✓ Copied" : "Click to copy"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Hints Section */}
        {smartHints.length > 0 && (
          <Card className="mt-2 border-blue-6 bg-blue-2">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px] font-semibold text-blue-11">💡 相关提示</span>
              </div>
              <div className="space-y-3">
                {smartHints.map((section, idx) => (
                  <div key={idx}>
                    <div className="text-[11px] font-semibold text-gray-12 mb-1">
                      {section.category}
                    </div>
                    <div className="space-y-1 pl-2">
                      {section.hints.map((hint, hintIdx) => (
                        <div key={hintIdx} className="text-[11px] text-gray-11">
                          <code className="text-blue-11 bg-blue-3 px-1 py-0.5 rounded">
                            {hint.code}
                          </code>{" "}
                          - {hint.description}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
