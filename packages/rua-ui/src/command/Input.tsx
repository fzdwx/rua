import * as React from "react";
import { ActionId, ActionTree } from "./types.ts";
import { ActionImpl } from "./action";
import { LeftButton, InputLoading } from "@rua/ui";

export const KBAR_LISTBOX = "kbar-listbox";
export const getListboxItemId = (id: number) => `kbar-listbox-item-${id}`;

interface InputProps {
  value: string;
  actions: ActionTree;
  onValueChange: (value: string) => void;
  onCurrentRootActionIdChange: (id: ActionId | null) => void;
  currentRootActionId: ActionId | null;
  activeAction?: ActionImpl | null; // Currently active action in results
  onQuerySubmit?: (query: string, actionId: ActionId) => void; // Called when query is submitted
  setResultHandleEvent?: (enabled: boolean) => void; // Control whether ResultsRender handles keyboard events
  loading?: boolean; // Show loading indicator in input
  disableTabFocus?: boolean; // Remove search box from tab order
  focusQueryInput?: boolean; // Signal to focus query input

  defaultPlaceholder?: string;
  inputRefSetter?: (ref: HTMLInputElement) => void;
}

export function Input({
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
  loading,
  disableTabFocus,
  focusQueryInput,
}: InputProps) {
  const [inputValue, setInputValue] = React.useState(value);
  const [queryValue, setQueryValue] = React.useState("");
  const [queryFocused, setQueryFocused] = React.useState(false);
  const [textWidth, setTextWidth] = React.useState(0);

  const mainInputRef = React.useRef<HTMLInputElement>(null);
  const queryInputRef = React.useRef<HTMLInputElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

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
    if (mainInputRef.current) {
      const text = inputValue || "";
      // Create canvas if not exists
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        const computedStyle = window.getComputedStyle(mainInputRef.current);

        // Set font to match input exactly
        context.font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;

        // Measure text
        const metrics = context.measureText(text);
        setTextWidth(metrics.width);
      }
    }
  }, [inputValue]);

  // Check if active action has query flag
  // Show query input when an action with query flag is selected in the main list
  const showQueryInput = activeAction?.query && !currentRootActionId;

  // Reset query when active action changes
  React.useEffect(() => {
    setQueryValue("");
    setQueryFocused(false);
  }, [activeAction?.id]);

  // Focus query input when requested
  React.useEffect(() => {
    if (focusQueryInput && showQueryInput && !queryFocused) {
      setQueryFocused(true);
      // Use timeout to ensure the query input is rendered
      setTimeout(() => {
        queryInputRef.current?.focus();
      }, 0);
    }
  }, [focusQueryInput, showQueryInput, queryFocused]);

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

    // Enter to submit query (allow empty query)
    if (event.key === "Enter" && activeAction) {
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
    <div style={{ position: "relative", borderBottom: "1px solid var(--gray6)" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* Back arrow when inside an action */}
        {currentRootActionId && <LeftButton onClick={handleBackClick} />}

        <div style={{ position: "relative", flex: 1 }}>
          <input
            ref={mainInputRef}
            autoFocus
            id="command-input"
            className="command-input"
            autoComplete="off"
            role="combobox"
            spellCheck="false"
            value={inputValue}
            placeholder={placeholder}
            disabled={disableTabFocus}
            tabIndex={disableTabFocus ? -1 : 0}
            onChange={(event) => {
              setInputValue(event.target.value);
              onValueChange?.(event.target.value);
            }}
            onKeyDown={handleMainInputKeyDown}
            onFocus={() => {
              setResultHandleEvent?.(true); // Enable ResultsRender keyboard handling
            }}
          />

          {showQueryInput && (
            <>
              {/* Query input positioned after the text */}
              <div
                style={{
                  position: "absolute",
                  left: `${16 + textWidth + 16}px`, // 16px input padding + 16px spacing
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <input
                  ref={queryInputRef}
                  className="command-query-input"
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
                    pointerEvents: "auto",
                    width: queryValue ? `${Math.max(100, queryValue.length * 8 + 24)}px` : "100px",
                    maxWidth: "400px",
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loading indicator at bottom of entire input area */}
      <InputLoading loading={loading} />
    </div>
  );
}
