import {useMemo, useState, useEffect} from "react";

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
 * Generate time information
 */
function generateTimeInfo(): TimeInfo {
    const now = new Date();

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
    const timestampMs = Date.now().toString();
    const timestampS = Math.floor(Date.now() / 1000).toString();

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
 * Check if input matches a built-in function
 */
export function isBuiltInFunction(input: string): boolean {
    const normalized = normalizeFunctionName(input.toLowerCase());
    return Object.keys(builtInFunctions).some(
        funcName => funcName.toLowerCase() === normalized
    );
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
                    return { ...funcResult, timeInfo };
                }
                return funcResult;
            }
        }

        return null;
    }, [normalized, timeInfo]);

    if (!result) {
        return null;
    }

    // Handler for copying individual items
    const handleCopyItem = async (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopiedItem(value);
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
                    <div style={{fontSize: "24px"}}>{result.icon}</div>
                    <div style={{flex: 1}}>
                        <div
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "var(--gray12)",
                            }}
                        >
                            {result.primary}
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
            style={{
                padding: "10px 12px",
                background: "var(--gray2)",
                border: "1px solid var(--gray6)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                position: "relative",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gray3)";
                e.currentTarget.style.borderColor = "var(--gray7)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--gray2)";
                e.currentTarget.style.borderColor = "var(--gray6)";
            }}
        >
            {/* Copy icon in top-right corner */}
            <div
                style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    fontSize: "14px",
                    color: copiedItem === value ? "var(--green11)" : "var(--gray10)",
                    transition: "color 0.2s ease",
                }}
            >
                {copiedItem === value ? "✓" : "📋"}
            </div>

            {/* Label */}
            <div
                style={{
                    fontSize: "11px",
                    color: "var(--gray11)",
                    marginBottom: "4px",
                }}
            >
                {label}
            </div>

            {/* Value */}
            <div
                style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "var(--gray12)",
                    wordBreak: "break-all",
                    paddingRight: "24px",
                }}
            >
                {value}
            </div>
        </div>
    );

    return (
        <div
            style={{
                margin: "12px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
            }}
        >
            {/* Row 1: 当前时间 (full width) */}
            <TimeCard
                label="当前时间"
                value={info.dateTime}
                onClick={(e) => handleCopyItem(info.dateTime, e)}
            />

            {/* Row 2: 时间戳 (ms) | Unix时间戳 (s) (two columns) */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                }}
            >
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
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                }}
            >
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
