import {QuickResult as QuickResultType} from "./useQuickActions";

interface QuickResultProps {
    result: QuickResultType;
}

export function QuickResult({result}: QuickResultProps) {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result.result);
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
                            marginBottom: "4px",
                        }}
                    >
                        {result.result}
                    </div>
                    <div
                        style={{
                            fontSize: "12px",
                            color: "var(--gray11)",
                        }}
                    >
                        {result.type === "calculation"
                            ? `= ${result.expression}`
                            : result.expression}
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
