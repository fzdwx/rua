import {useState} from "react";
import {toast} from "sonner";
import {Toaster} from "@/components/ui/sonner.tsx";

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
    min?: number;        // For rand min,max
    max?: number;        // For rand min,max
}

// Default max value when only min is specified
const DEFAULT_RAND_MAX = 100;

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
            multiplier: parseFloat(multiplyMatch[1])
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
    if (trimmed === 'rand' || trimmed === 'rand()') {
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
        label
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
            primary: crypto.randomUUID()
        };
    },
    "random()": () => {
        return {
            type: "simple",
            icon: "🎲",
            primary: Math.random().toString()
        };
    },
    "rand()": () => {
        return {
            type: "simple",
            icon: "🎲",
            primary: Math.random().toString()
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
        funcName => funcName.toLowerCase() === normalized
    );

    if (hasStandardFunc) return true;

    // Check rand expressions
    if (parseRandExpression(input) !== null) {
        return true;
    }

    return false;
}

export function UtilityDisplay({input}: UtilityDisplayProps) {
    const [copiedItem, setCopiedItem] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    const trimmedInput = input.trim();
    const normalized = normalizeFunctionName(trimmedInput.toLowerCase());

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
            toast.success(<div>
                Copied <span className="clip_hight">{result!.primary}</span> to Clipboard Success
            </div>);
            setTimeout(() => setCopiedItem(null), 1000);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
            toast.error("Failed to copy to clipboard");
        }
    };

    return (
        <>
            <Toaster position="bottom-center"/>
            <div className="mx-3 my-2">
                {/* Main Result Card */}
                <div
                    onClick={handleCopy}
                    className="px-4 py-3 bg-[var(--gray3)] border border-[var(--gray6)] rounded-lg cursor-pointer transition-all duration-200 hover:bg-[var(--gray4)] hover:border-[var(--gray7)]"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">{result.icon}</div>
                        <div className="flex-1">
                            {result.label && (
                                <div className="text-[11px] text-[var(--gray11)] mb-1">
                                    {result.label}
                                </div>
                            )}
                            <div className="text-xl font-semibold text-[var(--gray12)]">
                                {result.primary}
                            </div>
                        </div>
                        <div className={`text-[11px] px-2 py-1 rounded transition-colors duration-200 ${
                            copiedItem === result.primary
                                ? 'text-[var(--green11)] bg-[var(--green3)]'
                                : 'text-[var(--gray10)] bg-[var(--gray5)]'
                        }`}>
                            {copiedItem === result.primary ? '✓ Copied' : 'Click to copy'}
                        </div>
                    </div>
                </div>

                {/* Syntax Help Section */}
                <div className="mt-2 border border-[var(--gray6)] rounded-md overflow-hidden">
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="w-full px-3 py-2 bg-[var(--gray2)] hover:bg-[var(--gray3)] transition-colors duration-150 flex items-center justify-between text-[12px] text-[var(--gray11)]"
                    >
                        <span>💡 语法提示</span>
                        <span className="text-[10px]">{showHelp ? '▲' : '▼'}</span>
                    </button>

                    {showHelp && (
                        <div className="px-3 py-3 bg-[var(--gray1)] text-[11px] text-[var(--gray11)] space-y-3">
                            {/* UUID */}
                            <div>
                                <div className="font-semibold text-[var(--gray12)] mb-1">UUID 生成</div>
                                <div className="space-y-1 pl-2">
                                    <div><code className="text-[var(--blue11)]">uuid()</code> - 生成 UUID v4</div>
                                </div>
                            </div>

                            {/* Random */}
                            <div>
                                <div className="font-semibold text-[var(--gray12)] mb-1">随机数生成</div>
                                <div className="space-y-1 pl-2">
                                    <div><code className="text-[var(--blue11)]">rand</code> 或 <code className="text-[var(--blue11)]">random()</code> - 生成 0-1 之间的随机数</div>
                                    <div><code className="text-[var(--blue11)]">rand * 100</code> - 生成随机数并乘以 100</div>
                                    <div><code className="text-[var(--blue11)]">rand 1</code> 或 <code className="text-[var(--blue11)]">rand 1,</code> - 从 1 到 100（默认）</div>
                                    <div><code className="text-[var(--blue11)]">rand 1,50</code> - 生成 1 到 50 之间的随机数</div>
                                    <div><code className="text-[var(--blue11)]">rand 0.5,10.5</code> - 支持小数范围</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
