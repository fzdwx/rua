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
    const [textWidth, setTextWidth] = React.useState(0);

    const mainInputRef = React.useRef<HTMLInputElement>(null);
    const queryInputRef = React.useRef<HTMLInputElement>(null);
    const textMeasureRef = React.useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

    React.useEffect(() => {
        if (inputRefSetter && mainInputRef.current) {
            inputRefSetter(mainInputRef.current);
        }
    }, [inputRefSetter]);

    // Measure the width of the input text to position query input
    React.useEffect(() => {
        if (textMeasureRef.current && mainInputRef.current) {
            const text = inputValue || "";
            textMeasureRef.current.textContent = text;
            const width = textMeasureRef.current.offsetWidth;
            setTextWidth(width);
        }
    }, [inputValue]);

    // Check if active action has query flag
    const showQueryInput = activeAction?.query && !currentRootActionId;

    // Reset query when active action changes
    React.useEffect(() => {
        setQueryValue("");
        setQueryFocused(false);
    }, [activeAction?.id]);

    const placeholder = React.useMemo((): string => {
        // Don't show placeholder when query input is visible
        if (showQueryInput) {
            return "";
        }
        return defaultPlaceholder ?? "Type a command or search…";
    }, [defaultPlaceholder, showQueryInput]);

    const handleMainInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Backspace to go back
        if (currentRootActionId && !inputValue && event.key === "Backspace") {
            if (actions && onCurrentRootActionIdChange) {
                const parent = actions[currentRootActionId].parent ?? null;
                onCurrentRootActionIdChange(parent);
            }
        }

        // Tab key handling
        if (event.key === "Tab") {
            event.preventDefault(); // Always prevent default Tab behavior

            // If query input is shown, switch to it
            if (showQueryInput && !queryFocused) {
                setQueryFocused(true);
                queryInputRef.current?.focus();
                queryInputRef.current?.select();
            }
            // If query input is not shown, do nothing (keep focus on main input)
        }
    };

    const handleQueryInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Tab to switch back to main input
        if (event.key === "Tab") {
            event.preventDefault();
            setQueryFocused(false);
            mainInputRef.current?.focus();
            return;
        }

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

        // Backspace on empty query returns to main input
        if (event.key === "Backspace" && !queryValue) {
            event.preventDefault();
            setQueryFocused(false);
            mainInputRef.current?.focus();
        }
    };

    return (
        <div style={{position: 'relative'}}>
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
                <>
                    {/* Query input positioned after the text */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${16 + textWidth}px`, // 16px is the input padding
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            pointerEvents: 'none',
                        }}
                    >
                        <span className="command-query-separator" style={{pointerEvents: 'auto'}}>
                            →
                        </span>
                        <input
                            ref={queryInputRef}
                            className='command-query-input'
                            autoComplete="off"
                            spellCheck="false"
                            value={queryValue}
                            placeholder="Press Tab"
                            onChange={(event) => setQueryValue(event.target.value)}
                            onKeyDown={handleQueryInputKeyDown}
                            onFocus={() => setQueryFocused(true)}
                            onBlur={() => setQueryFocused(false)}
                            style={{
                                pointerEvents: 'auto',
                                width: queryValue ? `${Math.max(100, queryValue.length * 8 + 24)}px` : '100px',
                                maxWidth: '400px',
                            }}
                        />
                    </div>

                    {/* Hidden span for measuring text width */}
                    <span
                        ref={textMeasureRef}
                        style={{
                            position: 'absolute',
                            visibility: 'hidden',
                            whiteSpace: 'pre',
                            fontSize: '16px',
                            fontFamily: 'inherit',
                            padding: '0',
                            pointerEvents: 'none',
                        }}
                        aria-hidden="true"
                    />
                </>
            )}
        </div>
    );
};
