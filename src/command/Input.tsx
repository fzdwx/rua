import * as React from "react";
import {ActionId, ActionTree} from "./types";
import {ActionImpl} from "./action";
import {Icon} from "@iconify/react";

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
    setResultHandleEvent?: (enabled: boolean) => void;  // Control whether ResultsRender handles keyboard events

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
                          setResultHandleEvent,
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
        // Don't show placeholder when query input is visible or inside an action
        if (showQueryInput || currentRootActionId) {
            return "";
        }
        return defaultPlaceholder ?? "Type a command or search…";
    }, [defaultPlaceholder, showQueryInput, currentRootActionId]);

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
            event.stopPropagation(); // Prevent ResultsRender from handling this event
            if (onQuerySubmit) {
                onQuerySubmit(queryValue.trim(), activeAction.id);
            }
            setQueryValue("");
            setQueryFocused(false);
            mainInputRef.current?.focus();
            return;
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

    const handleBackClick = () => {
        if (currentRootActionId && actions && onCurrentRootActionIdChange) {
            const parent = actions[currentRootActionId].parent ?? null;
            onCurrentRootActionIdChange(parent);
        }
    };

    return (
        <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            {/* Back arrow when inside an action */}
            {currentRootActionId && (
                <div
                    onClick={handleBackClick}
                    style={{
                        marginLeft: '12px',
                        marginRight: '12px',
                        padding: '6px',
                        cursor: 'pointer',
                        color: 'var(--gray11)',
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        borderRadius: '6px',
                        background: 'var(--gray3)',
                        border: '1px solid var(--gray6)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--gray12)';
                        e.currentTarget.style.background = 'var(--gray4)';
                        e.currentTarget.style.borderColor = 'var(--gray7)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--gray11)';
                        e.currentTarget.style.background = 'var(--gray3)';
                        e.currentTarget.style.borderColor = 'var(--gray6)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }}
                >
                    <Icon icon="tabler:arrow-left" />
                </div>
            )}

            <div style={{position: 'relative', flex: 1}}>
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
                            left: `${16 + textWidth + 16}px`, // 16px input padding + 16px spacing
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                            pointerEvents: 'none',
                        }}
                    >
                        <input
                            ref={queryInputRef}
                            className='command-query-input'
                            autoComplete="off"
                            spellCheck="false"
                            value={queryValue}
                            placeholder="Press Tab"
                            onChange={(event) => setQueryValue(event.target.value)}
                            onKeyDown={handleQueryInputKeyDown}
                            onFocus={() => {
                                setQueryFocused(true);
                                setResultHandleEvent?.(false); // Disable ResultsRender keyboard handling
                            }}
                            onBlur={() => {
                                setQueryFocused(false);
                                setResultHandleEvent?.(true); // Re-enable ResultsRender keyboard handling
                            }}
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
        </div>
    );
};
