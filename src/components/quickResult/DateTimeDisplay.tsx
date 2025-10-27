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
    targetTimezone?: string; // For timezone conversion
    targetDateTime?: string; // DateTime in target timezone
}

interface ParseResult {
    date: Date;
    targetTimezone?: string;
}

interface FunctionResult {
    type: "detailed";
    timeInfo: TimeInfo;
    icon: string;
}

/**
 * Generate time information from a given date or current time
 */
function generateTimeInfo(inputDate?: Date, targetTimezone?: string): TimeInfo {
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

    const result: TimeInfo = {
        dateTime,
        timestampMs,
        timestampS,
        date,
        time,
        timezone
    };

    // Add target timezone info if specified
    if (targetTimezone) {
        try {
            const targetDateTime = now.toLocaleString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZone: targetTimezone
            }).replace(/\//g, "-");

            result.targetTimezone = targetTimezone;
            result.targetDateTime = targetDateTime;
        } catch (error) {
            console.warn(`Invalid timezone: ${targetTimezone}`);
        }
    }

    return result;
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
 * Parse relative time expressions like "now + 1h", "now - 30m", "now +1d +1h -1y"
 * Supports chained expressions with multiple time offsets
 * Supported units: s (seconds), m (minutes), h (hours), d (days), w (weeks), M (months), y (years)
 */
function parseRelativeTime(input: string): Date | null {
    const trimmed = input.trim().toLowerCase();

    // Check if it starts with "now"
    if (!trimmed.startsWith('now')) return null;

    // Match all time offset patterns: +/-number followed by unit
    // Example: "now +1d +1h -30m" will match ["+1d", "+1h", "-30m"]
    const offsetPattern = /([+-])\s*(\d+)\s*([smhdwMy])/g;
    const matches = [...trimmed.matchAll(offsetPattern)];

    // Must have at least one offset
    if (matches.length === 0) return null;

    // Verify that the entire string is "now" followed by offsets
    // Reconstruct what the input should look like and compare
    const reconstructed = 'now' + matches.map(m => m[0]).join('').replace(/\s+/g, '');
    const normalizedInput = trimmed.replace(/\s+/g, '');
    if (reconstructed !== normalizedInput) return null;

    // Start with current time
    const result = new Date();

    // Apply each offset in order
    for (const match of matches) {
        const [, operator, amountStr, unit] = match;
        const amount = parseInt(amountStr);
        const multiplier = operator === '+' ? 1 : -1;

        switch (unit) {
            case 's': // seconds
                result.setSeconds(result.getSeconds() + (amount * multiplier));
                break;
            case 'm': // minutes
                result.setMinutes(result.getMinutes() + (amount * multiplier));
                break;
            case 'h': // hours
                result.setHours(result.getHours() + (amount * multiplier));
                break;
            case 'd': // days
                result.setDate(result.getDate() + (amount * multiplier));
                break;
            case 'w': // weeks
                result.setDate(result.getDate() + (amount * 7 * multiplier));
                break;
            case 'M': // months
                result.setMonth(result.getMonth() + (amount * multiplier));
                break;
            case 'y': // years
                result.setFullYear(result.getFullYear() + (amount * multiplier));
                break;
            default:
                return null;
        }
    }

    return result;
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
 * Parse input as timestamp, date, or relative time
 */
function parseInput(input: string): ParseResult | null {
    const trimmed = input.trim();

    // Check for timezone conversion patterns
    // Supports: "timestamp to timezone", "date in timezone", "now + 1h to timezone"
    const timezonePatterns = [
        /^(.+?)\s+(?:to|in)\s+([A-Za-z_]+(?:\/[A-Za-z_]+)?)$/i,
    ];

    for (const pattern of timezonePatterns) {
        const match = trimmed.match(pattern);
        if (match) {
            const [, dateInput, timezone] = match;
            const parsedDate = parseInputWithoutTimezone(dateInput.trim());
            if (parsedDate) {
                return {
                    date: parsedDate,
                    targetTimezone: timezone
                };
            }
        }
    }

    // No timezone specified, parse as regular date
    const parsedDate = parseInputWithoutTimezone(trimmed);
    if (parsedDate) {
        return {
            date: parsedDate
        };
    }

    return null;
}

/**
 * Parse input without timezone component
 */
function parseInputWithoutTimezone(input: string): Date | null {
    // Try relative time first (now + 1h, etc.)
    const relativeTime = parseRelativeTime(input);
    if (relativeTime) return relativeTime;

    // Try timestamp
    const timestamp = parseTimestamp(input);
    if (timestamp) return timestamp;

    // Try date string
    const dateStr = parseDateString(input);
    if (dateStr) return dateStr;

    return null;
}

/**
 * Check if input is a partial/incomplete datetime expression that should still trigger display
 * This provides error tolerance for incomplete inputs
 */
function isPartialDateTimeExpression(input: string): boolean {
    const trimmed = input.trim().toLowerCase();

    // Incomplete relative time: "now", "now +", "now -", "now +1", "now +1d +", etc.
    // Match "now" optionally followed by incomplete offset patterns
    if (/^now(\s+([+-]\s*(\d+\s*([smhdwMy]\s*)?)?)?)*([+-]\s*)?$/.test(trimmed)) {
        return true;
    }

    // Incomplete timezone conversion: "now to", "now + 1h to", "1635724800 in", etc.
    if (/^.+\s+(?:to|in)\s*$/.test(trimmed)) {
        return true;
    }

    // Partial timestamp (1-9 digits that could be building up to a valid timestamp)
    if (/^\d{1,9}$/.test(trimmed)) {
        return true;
    }

    // Partial date strings that look like they're being typed
    // e.g., "202", "2023-", "2023-1", "2023年"
    if (/^\d{1,4}(-\d{0,2}(-\d{0,2})?)?$/.test(trimmed) || /^\d{4}年(\d{1,2}月?(\d{1,2}日?)?)?$/.test(trimmed)) {
        return true;
    }

    return false;
}

/**
 * Check if input is a parseable timestamp or date
 */
export function isParseableDateTime(input: string): boolean {
    return parseInput(input) !== null || isPartialDateTimeExpression(input);
}

/**
 * Built-in datetime functions
 */
const builtInFunctions: Record<string, () => FunctionResult> = {
    "now()": () => {
        return {
            type: "detailed",
            icon: "📅",
            timeInfo: generateTimeInfo()
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
 * Check if input matches a datetime function or parseable datetime
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

/**
 * Get smart hints based on current input
 */
function getSmartHints(input: string): Array<{category: string, hints: Array<{code: string, description: string}>}> {
    const trimmed = input.trim().toLowerCase();
    const hints: Array<{category: string, hints: Array<{code: string, description: string}>}> = [];

    // Now function hints
    if (trimmed === '' || trimmed === 'n' || trimmed === 'no' || trimmed === 'now') {
        hints.push({
            category: '内置函数',
            hints: [
                { code: 'now()', description: '显示当前时间（实时更新）' }
            ]
        });
    }

    // Relative time hints
    if (trimmed.startsWith('now') && (trimmed.includes('+') || trimmed.includes('-') || trimmed.match(/^now\s*$/))) {
        const relativeHints: Array<{code: string, description: string}> = [];

        if (!trimmed.match(/^now\s+[+-]\s*\d+\s*[smhdwMy]\s*$/)) {
            relativeHints.push({ code: 'now +1h', description: '1小时后' });
            relativeHints.push({ code: 'now -30m', description: '30分钟前' });
            relativeHints.push({ code: 'now +1d +2h', description: '1天2小时后（可连续）' });
        }

        if (relativeHints.length > 0) {
            hints.push({
                category: '相对时间',
                hints: relativeHints
            });
        }

        // Show unit reference if typing offset
        if (trimmed.match(/^now\s+[+-]\s*\d*[a-z]?$/i)) {
            hints.push({
                category: '时间单位',
                hints: [
                    { code: 's', description: '秒' },
                    { code: 'm', description: '分钟' },
                    { code: 'h', description: '小时' },
                    { code: 'd', description: '天' },
                    { code: 'w', description: '周' },
                    { code: 'M', description: '月' },
                    { code: 'y', description: '年' }
                ]
            });
        }
    }

    // Timezone conversion hints
    if (trimmed.includes('to ') || trimmed.includes('in ') || trimmed.endsWith('to') || trimmed.endsWith('in')) {
        hints.push({
            category: '时区转换',
            hints: [
                { code: 'now to UTC', description: '转换到 UTC' },
                { code: '1635724800 in Asia/Shanghai', description: '时间戳转时区' },
                { code: 'now +1d to America/New_York', description: '组合使用' }
            ]
        });
    }

    // Timestamp hints
    if (trimmed.match(/^\d{1,9}$/)) {
        hints.push({
            category: '时间戳',
            hints: [
                { code: '1635724800', description: '10位秒级时间戳' },
                { code: '1635724800000', description: '13位毫秒时间戳' }
            ]
        });
    }

    // Date string hints
    if (trimmed.match(/^\d{1,4}/) && !trimmed.match(/^\d{10,13}$/)) {
        hints.push({
            category: '日期字符串',
            hints: [
                { code: '2023-10-31', description: 'ISO 8601 格式' },
                { code: '2023年10月31日', description: '中文日期格式' }
            ]
        });
    }

    return hints;
}

export function DateTimeDisplay({input}: DateTimeDisplayProps) {
    const [copiedItem, setCopiedItem] = useState<string | null>(null);
    const [timeInfo, setTimeInfo] = useState<TimeInfo | null>(null);

    const trimmedInput = input.trim();
    const normalized = normalizeFunctionName(trimmedInput.toLowerCase());

    // Get smart hints based on input
    const smartHints = getSmartHints(trimmedInput);

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

        // Try to parse as timestamp, date, or relative time
        const parsed = parseInput(trimmedInput);
        if (parsed) {
            return {
                type: "detailed",
                icon: "🕐",
                timeInfo: generateTimeInfo(parsed.date, parsed.targetTimezone)
            } as FunctionResult;
        }

        // Check if it's a partial/incomplete expression
        // If so, show current time as fallback with help expanded
        if (isPartialDateTimeExpression(trimmedInput)) {
            return {
                type: "detailed",
                icon: "⏰",
                timeInfo: generateTimeInfo() // Show current time as default
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

    // All datetime results should have timeInfo
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

            {/* Row 5 (optional): 目标时区时间 (full width) - only shown when timezone conversion is requested */}
            {info.targetTimezone && info.targetDateTime && (
                <TimeCard
                    label={`目标时区 (${info.targetTimezone})`}
                    value={info.targetDateTime}
                    onClick={(e) => handleCopyItem(info.targetDateTime!, e)}
                />
            )}

            {/* Smart Hints Section */}
            {smartHints.length > 0 && (
                <div className="mt-2 border border-[var(--blue6)] bg-[var(--blue2)] rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[13px] font-semibold text-[var(--blue11)]">💡 相关提示</span>
                    </div>
                    <div className="space-y-3">
                        {smartHints.map((section, idx) => (
                            <div key={idx}>
                                <div className="text-[11px] font-semibold text-[var(--gray12)] mb-1">
                                    {section.category}
                                </div>
                                <div className="space-y-1 pl-2">
                                    {section.hints.map((hint, hintIdx) => (
                                        <div key={hintIdx} className="text-[11px] text-[var(--gray11)]">
                                            <code className="text-[var(--blue11)] bg-[var(--blue3)] px-1 py-0.5 rounded">
                                                {hint.code}
                                            </code>
                                            {' '}- {hint.description}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
