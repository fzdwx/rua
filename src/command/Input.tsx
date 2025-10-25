import * as React from "react";
import {ActionId, ActionTree} from "./types";
import {ActionImpl} from "./action";

export const KBAR_LISTBOX = "kbar-listbox";
export const getListboxItemId = (id: number) => `kbar-listbox-item-${id}`;

interface InputProps {
    value: string;
    actions: ActionTree;
    onValueChange: (value: string) => void
    onCurrentRootActionIdChange: (id: ActionId | null) => void;
    currentRootActionId: ActionId | null
    activeAction?: ActionImpl | null;  // Currently active action in results
    onQuerySubmit?: (query: string, actionId: ActionId) => void;  // Called when query is submitted

    defaultPlaceholder?: string;
    inputRefSetter?: (ref: HTMLInputElement) => void;
}

export const Input = ({
                          defaultPlaceholder,
                          value,
                          onValueChange,
                          inputRefSetter,
                          onCurrentRootActionIdChange,
                          currentRootActionId,
                          actions,
                          activeAction,
                          onQuerySubmit,
                      }: InputProps) => {
    const [inputValue, setInputValue] = React.useState(value);
    const [queryValue, setQueryValue] = React.useState("");
    const [queryFocused, setQueryFocused] = React.useState(false);

    const mainInputRef = React.useRef<HTMLInputElement>(null);
    const queryInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

    React.useEffect(() => {
        if (inputRefSetter && mainInputRef.current) {
            inputRefSetter(mainInputRef.current);
        }
    }, [inputRefSetter]);

    // Check if active action has query flag
    const showQueryInput = activeAction?.query && !currentRootActionId;

    // Reset query when active action changes
    React.useEffect(() => {
        setQueryValue("");
        setQueryFocused(false);
    }, [activeAction?.id]);

    const placeholder = React.useMemo((): string => {
        return defaultPlaceholder ?? "Type a command or search…";
    }, [defaultPlaceholder]);

    const handleMainInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Backspace to go back
        if (currentRootActionId && !inputValue && event.key === "Backspace") {
            if (actions && onCurrentRootActionIdChange) {
                const parent = actions[currentRootActionId].parent ?? null;
                onCurrentRootActionIdChange(parent);
            }
        }

        // Tab to switch to query input
        if (event.key === "Tab" && showQueryInput && !queryFocused) {
            event.preventDefault();
            setQueryFocused(true);
            queryInputRef.current?.focus();
        }
    };

    const handleQueryInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Enter to submit query
        if (event.key === "Enter" && queryValue.trim() && activeAction) {
            event.preventDefault();
            if (onQuerySubmit) {
                onQuerySubmit(queryValue.trim(), activeAction.id);
            }
            setQueryValue("");
            setQueryFocused(false);
            mainInputRef.current?.focus();
        }

        // Escape to return to main input
        if (event.key === "Escape") {
            event.preventDefault();
            setQueryFocused(false);
            setQueryValue("");
            mainInputRef.current?.focus();
        }
    };

    return (
        <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
            <input
                ref={mainInputRef}
                autoFocus
                id='command-input'
                className='command-input'
                autoComplete="off"
                role="combobox"
                spellCheck="false"
                value={inputValue}
                placeholder={placeholder}
                onChange={(event) => {
                    setInputValue(event.target.value);
                    onValueChange?.(event.target.value);
                }}
                onKeyDown={handleMainInputKeyDown}
            />

            {showQueryInput && (
                <input
                    ref={queryInputRef}
                    className='command-query-input'
                    autoComplete="off"
                    spellCheck="false"
                    value={queryValue}
                    placeholder={`Enter query for ${activeAction?.name}...`}
                    onChange={(event) => setQueryValue(event.target.value)}
                    onKeyDown={handleQueryInputKeyDown}
                    onFocus={() => setQueryFocused(true)}
                    onBlur={() => setQueryFocused(false)}
                    style={{
                        padding: "4px 8px",
                        fontSize: "12px",
                        border: queryFocused ? "1px solid var(--gray8)" : "1px solid var(--gray6)",
                        borderRadius: "4px",
                        background: "var(--gray3)",
                        color: "var(--gray12)",
                        outline: "none",
                        minWidth: "200px",
                        transition: "border-color 0.2s ease",
                    }}
                />
            )}
        </div>
    );
};
