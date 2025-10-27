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
    return Object.keys(utilityFunctions).some(
        funcName => funcName.toLowerCase() === normalized
    );
}

export function UtilityDisplay({input}: UtilityDisplayProps) {
    const [copiedItem, setCopiedItem] = useState<string | null>(null);

    const trimmedInput = input.trim();
    const normalized = normalizeFunctionName(trimmedInput.toLowerCase());

    // Check for utility functions
    let result: UtilityResult | null = null;
    for (const [funcName, funcImpl] of Object.entries(utilityFunctions)) {
        if (normalized === funcName.toLowerCase()) {
            result = funcImpl();
            break;
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
            <div
                onClick={handleCopy}
                className="mx-3 my-2 px-4 py-3 bg-[var(--gray3)] border border-[var(--gray6)] rounded-lg cursor-pointer transition-all duration-200 hover:bg-[var(--gray4)] hover:border-[var(--gray7)]"
            >
                <div className="flex items-center gap-3">
                    <div className="text-2xl">{result.icon}</div>
                    <div className="flex-1">
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
        </>
    );
}
