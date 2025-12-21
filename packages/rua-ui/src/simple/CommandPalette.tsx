import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useCommand} from "./useCommand";
import {Input} from "@/command";
import {ResultsRender} from "@/command";
import {Footer} from "@/command";
import type {CommandPaletteProps, UseCommandReturn} from "./types";
import type {PanelProps, Action} from "@/command/types";
import {attemptFocusWithRetry} from "./utils";
import {Background, Container} from "@/common/tools";

/**
 * Convert a relative path to an ext:// protocol URL
 * @param path - Relative path (e.g., "./icon.png")
 * @param extPath - Extension directory path
 * @returns ext:// URL
 */
function toExtURL(path: string, extPath: string): string {
  const encodedBaseDir = btoa(extPath).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  let fileName = path.replace(/^\.\//, "");
  return `ext://${encodedBaseDir}/${fileName}`;
}

/**
 * Panel state for custom action panels
 */
interface PanelState {
  /** The panel render function */
  render: (props: PanelProps) => React.ReactElement;
  /** The action ID that opened this panel */
  actionId: string;
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
    navigationIcon,
    navigationTitle,
    ...hookOptions
  } = props;

  // Panel state for custom action panels
  const [activePanel, setActivePanel] = useState<PanelState | null>(null);
  const panelInputRef = useRef<HTMLElement>(null);

  // Get default navigation from manifest action info (when rua is provided)
  // rua.extension.currentAction contains the current action's info from manifest
  const currentAction = rua?.extension?.currentAction;
  const extensionPath = rua?.extension?.path;
  const defaultNavigationTitle = currentAction?.title || undefined;
  
  // Convert icon path to ext:// URL if it's a relative path and extension path is available
  const defaultNavigationIcon = useMemo(() => {
    const icon = currentAction?.icon;
    if (!icon) return undefined;
    
    // Check if it's a relative path that needs conversion
    if (extensionPath && (icon.startsWith("./") || icon.startsWith("../") || icon.startsWith("/"))) {
      return toExtURL(icon, extensionPath);
    }
    return icon;
  }, [currentAction?.icon, extensionPath]);

  // Resolve final navigation values - custom props override manifest defaults
  const resolvedNavigationIcon = navigationIcon ?? defaultNavigationIcon;
  const resolvedNavigationTitle = navigationTitle ?? defaultNavigationTitle;

  const command = useCommand({
    actions,
    navigationIcon: resolvedNavigationIcon,
    navigationTitle: resolvedNavigationTitle,
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

  // Build footer actions for panel mode (only for action buttons, not navigation)
  const panelFooterActions = useMemo(() => {
    if (!activePanel) return undefined;

    return (current: any, changeVisible: () => void) => {
      const close = () => {
        changeVisible();
        handleClosePanel();
      };
      if (activePanel.panelFooterActions) {
        return activePanel.panelFooterActions(close);
      }
      return [
        {
          id: "close-panel",
          name: "Close",
          icon: "←",
          perform: close,
        },
      ];
    };
  }, [activePanel, handleClosePanel]);

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
          panelFooterActions={panelFooterActions}
          command={command}
          rightElement={rightElement}
          onPanelActionEnter={handlePanelActionEnter}
        />
      </Background>
    </Container>
  );
}

export interface ActiveFooterProps {
  activePanel?: PanelState | null;
  command?: UseCommandReturn;
  rightElement?: React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
  panelFooterActions?: (current: any, changeVisible: () => void) => Action[];
  onPanelActionEnter?: (action: any) => void;
}

function ActiveFooter({activePanel, command, rightElement, panelFooterActions, onPanelActionEnter}: ActiveFooterProps) {
  // When panel is open, use panel footer actions but keep navigation from command
  const footerProps = activePanel && panelFooterActions
    ? { ...command.footerProps, actions: panelFooterActions }
    : command.footerProps;

  return <Footer {...footerProps} rightElement={rightElement} onPanelActionEnter={onPanelActionEnter}/>;
}
