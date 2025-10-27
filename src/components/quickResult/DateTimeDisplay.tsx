import React, {useMemo, useState, useEffect} from "react";
import { toast } from "sonner"
import {Toaster} from "@/components/ui/sonner.tsx";

interface DateTimeDisplayProps {
    input: string;
}

interface TimeInfo {
    dateTime: string;
    timestampMs: string;
    timestampS: string;
    date: string;
    time: string;
    timezone: string;
}

interface FunctionResult {
    type: "simple" | "detailed";
    primary?: string;
    timeInfo?: TimeInfo;
    icon: string;
}

/**
 * Generate time information from a given date or current time
 */
function generateTimeInfo(inputDate?: Date): TimeInfo {
    const now = inputDate || new Date();

    // Format date time
    const dateTime = now.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).replace(/\//g, "-");

    // Get timestamps
    const timestampMs = now.getTime().toString();
    const timestampS = Math.floor(now.getTime() / 1000).toString();

    // Get date only
    const date = now.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).replace(/\//g, "-");

    // Get time only
    const time = now.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    // Get timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
        dateTime,
        timestampMs,
        timestampS,
        date,
        time,
        timezone
    };
}

/**
 * Try to parse timestamp (seconds or milliseconds)
 */
function parseTimestamp(input: string): Date | null {
    const trimmed = input.trim();
    const num = Number(trimmed);

    // Check if it's a valid number
    if (isNaN(num)) return null;

    // 10-digit timestamp (seconds) - range: 1970-2286
    if (/^\d{10}$/.test(trimmed)) {
        return new Date(num * 1000);
    }

    // 13-digit timestamp (milliseconds) - range: 1970-2286
    if (/^\d{13}$/.test(trimmed)) {
        return new Date(num);
    }

    return null;
}

/**
 * Try to parse date string
 */
function parseDateString(input: string): Date | null {
    const trimmed = input.trim();

    // Try standard Date parsing
    const date = new Date(trimmed);

    // Check if it's a valid date
    if (!isNaN(date.getTime())) {
        return date;
    }

    // Try parsing Chinese date format like "2023年10月31日"
    const chineseMatch = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?/);
    if (chineseMatch) {
        const [, year, month, day] = chineseMatch;
        const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    return null;
}

/**
 * Parse input as timestamp or date
 */
function parseInput(input: string): Date | null {
    // Try timestamp first
    const timestamp = parseTimestamp(input);
    if (timestamp) return timestamp;

    // Try date string
    const dateStr = parseDateString(input);
    if (dateStr) return dateStr;

    return null;
}

/**
 * Check if input is a parseable timestamp or date
 */
export function isParseableDateTime(input: string): boolean {
    return parseInput(input) !== null;
}

/**
 * Built-in utility functions
 */
const builtInFunctions: Record<string, () => FunctionResult> = {
    "now()": () => {
        return {
            type: "detailed",
            icon: "📅",
            timeInfo: generateTimeInfo()
        };
    },
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
 * Check if input matches a built-in function or parseable datetime
 */
export function isBuiltInFunction(input: string): boolean {
    const normalized = normalizeFunctionName(input.toLowerCase());
    const hasBuiltInFunc = Object.keys(builtInFunctions).some(
        funcName => funcName.toLowerCase() === normalized
    );

    if (hasBuiltInFunc) return true;

    // Also check if it's a parseable datetime
    return isParseableDateTime(input);
}

export function DateTimeDisplay({input}: DateTimeDisplayProps) {
    const [copiedItem, setCopiedItem] = useState<string | null>(null);
    const [timeInfo, setTimeInfo] = useState<TimeInfo | null>(null);

    const trimmedInput = input.trim();
    const normalized = normalizeFunctionName(trimmedInput.toLowerCase());

    // Check if this is the now function
    const isNowFunction = normalized === "now()";

    // Initialize and refresh time info for now function
    useEffect(() => {
        if (!isNowFunction) return;

        // Initial load
        setTimeInfo(generateTimeInfo());

        // Refresh every second
        const interval = setInterval(() => {
            setTimeInfo(generateTimeInfo());
        }, 1000);

        return () => clearInterval(interval);
    }, [isNowFunction]);

    const result = useMemo(() => {
        // Check for built-in functions
        for (const [funcName, funcImpl] of Object.entries(builtInFunctions)) {
            if (normalized === funcName.toLowerCase()) {
                const funcResult = funcImpl();
                // For now function, use the state-managed timeInfo
                if (funcName === "now()" && timeInfo) {
                    return {...funcResult, timeInfo};
                }
                return funcResult;
            }
        }

        // Try to parse as timestamp or date
        const parsedDate = parseInput(trimmedInput);
        if (parsedDate) {
            return {
                type: "detailed",
                icon: "🕐",
                timeInfo: generateTimeInfo(parsedDate)
            } as FunctionResult;
        }

        return null;
    }, [normalized, timeInfo, trimmedInput]);

    if (!result) {
        return null;
    }

    // Handler for copying individual items
    const handleCopyItem = async (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopiedItem(value);
            toast.success(<div>
                Copied <span className="clip_hight">{value}</span> to Clipboard Success
            </div>)
            setTimeout(() => setCopiedItem(null), 1000);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
        }
    };

    // Simple type display
    if (result.type === "simple") {
        const handleCopy = async () => {
            try {
                await navigator.clipboard.writeText(result.primary!);
            } catch (error) {
                console.error("Failed to copy to clipboard:", error);
            }
        };

        return (
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
                    <div className="text-[11px] text-[var(--gray10)] px-2 py-1 bg-[var(--gray5)] rounded">
                        Click to copy
                    </div>
                </div>
            </div>
        );
    }

    // Detailed type display (for now function)
    if (!result.timeInfo) return null;

    const info = result.timeInfo;

    // Reusable card component
    const TimeCard = ({
                          label,
                          value,
                          onClick
                      }: {
        label: string;
        value: string;
        onClick: (e: React.MouseEvent) => void;
    }) => (
        <div
            onClick={onClick}
            className="relative p-3 bg-[var(--gray2)] border border-[var(--gray6)] rounded-md cursor-pointer transition-all duration-150 hover:bg-[var(--gray3)] hover:border-[var(--gray7)]"
        >
            {/* Copy icon in top-right corner */}
            <div
                className={`absolute top-2 right-2 flex items-center justify-center w-5 h-5 text-sm transition-colors duration-200 ${
                    copiedItem === value ? 'text-[var(--green11)]' : 'text-[var(--gray10)]'
                }`}>
                {copiedItem === value ? "✓" : "📋"}
            </div>

            {/* Label */}
            <div className="text-[11px] text-[var(--gray11)] mb-1">
                {label}
            </div>

            {/* Value */}
            <div className="text-[15px] font-medium text-[var(--gray12)] break-all pr-6">
                {value}
            </div>
        </div>
    );

    return (
        <div className="mx-3 my-3 flex flex-col gap-2">
            <Toaster position="bottom-center"/>
            {/* Row 1: 当前时间 (full width) */}
            <TimeCard
                label="当前时间"
                value={info.dateTime}
                onClick={(e) => handleCopyItem(info.dateTime, e)}
            />

            {/* Row 2: 时间戳 (ms) | Unix时间戳 (s) (two columns) */}
            <div className="grid grid-cols-2 gap-2">
                <TimeCard
                    label="时间戳 (ms)"
                    value={info.timestampMs}
                    onClick={(e) => handleCopyItem(info.timestampMs, e)}
                />
                <TimeCard
                    label="Unix时间戳 (s)"
                    value={info.timestampS}
                    onClick={(e) => handleCopyItem(info.timestampS, e)}
                />
            </div>

            {/* Row 3: 日期 | 时间 (two columns) */}
            <div className="grid grid-cols-2 gap-2">
                <TimeCard
                    label="日期"
                    value={info.date}
                    onClick={(e) => handleCopyItem(info.date, e)}
                />
                <TimeCard
                    label="时间"
                    value={info.time}
                    onClick={(e) => handleCopyItem(info.time, e)}
                />
            </div>

            {/* Row 4: 时区 (full width) */}
            <TimeCard
                label="时区"
                value={info.timezone}
                onClick={(e) => handleCopyItem(info.timezone, e)}
            />
        </div>
    );
}
