import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useCommand} from "./useCommand";
import {Input} from "@/command";
import {ResultsRender} from "@/command";
import {Footer} from "@/command";
import type {CommandPaletteProps, PanelFooter, UseCommandReturn} from "./types";
import type {PanelProps, Action} from "@/command/types";
import {attemptFocusWithRetry} from "./utils";
import {Background, Container} from "@/common/tools";

/**
 * Panel state for custom action panels
 */
interface PanelState {
  /** The panel render function */
  render: (props: PanelProps) => React.ReactElement;
  /** The action ID that opened this panel */
  actionId: string;
  /** Title for footer when panel is open */
  panelTitle?: string;
  /** Footer actions for this panel */
  panelFooterActions?: (onClose: () => void) => Action[];
}

/**
 * Pre-built command palette component with sensible defaults
 *
 * This component provides a complete command palette UI out of the box.
 * It automatically handles all state management internally using useCommand.
 *
 * @param props - CommandPalette configuration
 * @returns Complete command palette UI
 *
 * @example
 * <CommandPalette
 *   actions={todoActions}
 *   placeholder="Search todos..."
 *   onQuerySubmit={handleCreateTodo}
 *   emptyState={({ search }) => (
 *     <div>No results for "{search}"</div>
 *   )}
 * />
 */
export function CommandPalette(props: CommandPaletteProps) {
  const {
    className = "",
    emptyStateClassName = "",
    autoFocus = true,
    rightElement,
    emptyState,
    actions,
    rua,
    ...hookOptions
  } = props;

  // Panel state for custom action panels
  const [activePanel, setActivePanel] = useState<PanelState | null>(null);
  const panelInputRef = useRef<HTMLElement>(null);

  const command = useCommand({
    actions,
    ...hookOptions,
  });

  // Store command in ref to avoid re-registering event listeners on every render
  const commandRef = useRef(command);
  useEffect(() => {
    commandRef.current = command;
  }, [command]);

  // Close panel handler
  const handleClosePanel = useCallback(() => {
    setActivePanel(null);
    // Re-focus input after closing panel
    setTimeout(() => {
      commandRef.current.focusInput();
    }, 0);
  }, []);

  // Watch for active action changes to detect panel actions
  useEffect(() => {
    const activeAction = command.activeAction;
    if (!activeAction) return;

    // Check if the active action has a panel and user pressed Enter
    // We need to intercept the perform action
  }, [command.activeAction]);

  // Handle panel action enter - called from ResultsRender
  const handlePanelActionEnter = useCallback((action: any) => {
    if (!action?.panel) return;

    setActivePanel({
      render: action.panel,
      actionId: action.id,
      panelTitle: action.panelTitle,
      panelFooterActions: action.panelFooterActions,
    });
  }, []);

  // Override the resultsProps to intercept action selection for panel actions
  const enhancedResultsProps = {
    ...command.resultsProps,
    onRender: command.resultsProps.onRender,
    onPanelActionEnter: handlePanelActionEnter,
  };

  // Auto-focus input on mount when autoFocus is enabled
  useEffect(() => {
    if (!autoFocus) return;

    // Focus immediately on mount
    const focusOnMount = async () => {
      await attemptFocusWithRetry(() => commandRef.current, {
        maxRetries: 7,
        initialDelay: 30,
        backoffMultiplier: 2,
      });
    };

    focusOnMount();
  }, [autoFocus]);

  // Auto-focus input when extension is activated (for subsequent activations)
  useEffect(() => {
    if (!rua || !autoFocus) return;

    const handleActivate = async () => {
      await attemptFocusWithRetry(() => commandRef.current, {
        maxRetries: 7,
        initialDelay: 30,
        backoffMultiplier: 2,
      });
    };

    rua.on("activate", handleActivate);

    return () => {
      rua.off("activate", handleActivate);
    };
  }, [autoFocus, rua]);

  // Handle ESC and Backspace for window hiding
  useEffect(() => {
    if (!rua) return; // Only add listener if rua is provided

    const handleKeyDown = (event: KeyboardEvent) => {
      // If panel is open, ESC should close the panel first
      if (activePanel && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleClosePanel();
        return;
      }

      // Only handle ESC and Backspace
      if (event.key !== "Escape" && event.key !== "Backspace") {
        return;
      }

      // Check if we're at root level (no parent action)
      const isAtRoot = !command.rootActionId;

      // Check if search is empty
      const isSearchEmpty = !command.search || command.search.trim() === "";

      // For ESC: hide window if at root with empty search
      if (event.key === "Escape" && isAtRoot && isSearchEmpty) {
        event.preventDefault();
        event.stopPropagation();
        rua.hideWindow().catch((err) => {
          console.error("Failed to hide window:", err);
        });
        return;
      }

      // For Backspace: hide window if at root with empty search
      // But only if the input element is focused and empty
      if (event.key === "Backspace" && isAtRoot && isSearchEmpty) {
        const target = event.target as HTMLElement;
        // Check if the event is from an input and it's empty
        if (target.tagName === "INPUT" && (target as HTMLInputElement).value === "") {
          event.preventDefault();
          event.stopPropagation();
          if (activePanel != null) {
            handleClosePanel()
            return;
          }
          rua.ui.close().catch((err) => {
            console.error("Failed to hide window:", err);
          });
          return;
        }
      }
    };

    // Use capture phase to intercept before Input component
    document.addEventListener("keydown", handleKeyDown, {capture: true});

    return () => {
      document.removeEventListener("keydown", handleKeyDown, {capture: true});
    };
  }, [rua, command.rootActionId, command.search, activePanel, handleClosePanel]);

  // Determine if we should show empty state
  const showEmptyState = command.results.length === 0 && !command.search && actions.length === 0;

  // Check if input should be disabled (when panel is open)
  const isInputDisabled = !!activePanel;

  // Build footer props for panel mode
  const panelFooterProps: PanelFooter = useMemo(() => {
    if (!activePanel) return null;

    // Find the action that opened the panel to get its info
    const panelAction = actions.find((a) => a.id === activePanel.actionId);
    const icon = typeof panelAction?.icon === "string" ? panelAction.icon : "📝";
    const title = activePanel.panelTitle || panelAction?.name || "Panel";
    const panelActions = (current, closePopver) => {
      if (activePanel.panelFooterActions) {
        return activePanel.panelFooterActions!(handleClosePanel)
      }
    }

    return {
      current: null,
      icon,
      content: () => title,
      actions: (current, changeVisible) => {
        const close = ()=>{
          changeVisible()
          handleClosePanel()
        }
        if (activePanel.panelFooterActions) {
          return activePanel.panelFooterActions!(close)
        }
        return [
          {
            id: "close-panel",
            name: "Close",
            icon: "←",
            perform: close,
          },
        ]
      },
      // mainInputRef: panelInputRef,
      mainInputRef: command.footerProps.mainInputRef,
    };
  }, [activePanel, actions, handleClosePanel, command.footerProps.mainInputRef]);

  return (
    <Container>
      <Background>
        <Input
          {...command.inputProps}
          autoFocus={autoFocus && !isInputDisabled}
          disableTabFocus={isInputDisabled}
        />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {activePanel ? (
            // Render custom panel
            (() => {
              const PanelContent = activePanel.render;
              return (
                <div
                  className="command-listbox-container"
                  style={{
                    flex: 1,
                    minHeight: 0,
                    position: "relative",
                    overflow: "auto",
                    width: "100%",
                  }}
                >
                  <PanelContent
                    onClose={handleClosePanel}
                    afterPopoverFocusElement={panelInputRef}
                  />
                </div>
              );
            })()
          ) : showEmptyState && emptyState ? (
            <div
              className={`flex flex-col items-center justify-center px-6 py-12 overflow-auto ${emptyStateClassName}`}
              style={{flex: 1, minHeight: 0}}
            >
              {emptyState({search: command.search, actions})}
            </div>
          ) : (
            <ResultsRender {...enhancedResultsProps} />
          )}
        </div>

        <ActiveFooter
          activePanel={activePanel}
          panelFooterProps={panelFooterProps}
          command={command}
          rightElement={rightElement}
        />
      </Background>
    </Container>
  );
}

export interface ActiveFooterProps {
  activePanel?: PanelState;
  command?: UseCommandReturn;
  rightElement?: React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
  panelFooterProps?: PanelFooter;
}

function ActiveFooter({activePanel, command, rightElement, panelFooterProps}: ActiveFooterProps) {
  if (activePanel == null) {
    return <Footer {...command.footerProps} rightElement={rightElement}/>;
  }
  // @ts-ignore
  return <Footer {...panelFooterProps} rightElement={rightElement}/>;
}
