import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCommand } from "./useCommand";
import { Input } from "@/command";
import { ResultsRender } from "@/command";
import { GridRender } from "@/command/GridRender";
import { Footer } from "@/command";
import { DetailsPanel } from "@/command";
import type { CommandPaletteProps, UseCommandReturn } from "./types";
import type { Action } from "@/command/types";
import { attemptFocusWithRetry, calculateSplitWidths } from "./utils";
import { Background, Container } from "@/common/tools";

/**
 * Convert a relative path to an ext:// protocol URL
 */
function toExtURL(path: string, extPath: string): string {
  const encodedBaseDir = btoa(extPath).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  let fileName = path.replace(/^\.\//, "");
  return `ext://${encodedBaseDir}/${fileName}`;
}

/**
 * View item in the navigation stack
 */
export interface ViewItem {
  /** Unique identifier for this view */
  id: string;
  /** The component to render */
  component: React.ReactElement;
  /** Optional initial accessory element for footer */
  accessory?: React.ReactElement | null;
  /** Optional footer actions */
  footerActions?: (onClose: () => void) => Action[];
}

/**
 * Navigation context for push/pop operations
 */
export interface NavigationContextValue {
  /** Push a new view onto the stack */
  push: (view: ViewItem) => void;
  /** Pop the current view from the stack */
  pop: () => void;
  /** Replace the current view */
  replace: (view: ViewItem) => void;
  /** Pop all views and return to root */
  popToRoot: () => void;
  /** Update the current view's accessory (for dynamic accessory content) */
  setAccessory: (accessory: React.ReactElement | null) => void;
  /** Current stack depth (0 = root/list view) */
  depth: number;
  /** Ref for the main focusable element in the current view */
  focusRef: React.RefObject<HTMLElement>;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

/**
 * Hook to access navigation context for push/pop operations
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a CommandPalette");
  }
  return context;
}

/**
 * Pre-built command palette component with sensible defaults
 */
export function CommandPalette(props: CommandPaletteProps) {
  const {
    className = "",
    emptyStateClassName = "",
    autoFocus = true,
    accessory,
    emptyState,
    actions,
    rua,
    navigationIcon,
    navigationTitle,
    isShowDetails = false,
    detailsRatio = "1:2",
    layout = "list",
    gridConfig = {},
    ...hookOptions
  } = props;

  // Destructure grid config with defaults
  const { columns = 4, itemHeight = 140, gap = 12 } = gridConfig;

  // View stack for navigation
  const [viewStack, setViewStack] = useState<ViewItem[]>([]);
  const focusRef = useRef<HTMLElement>(null);

  // Get default navigation from manifest action info
  const currentAction = rua?.extension?.currentAction;
  const extensionPath = rua?.extension?.path;
  const defaultNavigationTitle = currentAction?.title || undefined;

  const defaultNavigationIcon = useMemo(() => {
    const icon = currentAction?.icon;
    if (!icon) return undefined;
    if (
      extensionPath &&
      (icon.startsWith("./") || icon.startsWith("../") || icon.startsWith("/"))
    ) {
      return toExtURL(icon, extensionPath);
    }
    return icon;
  }, [currentAction?.icon, extensionPath]);

  const resolvedNavigationIcon = navigationIcon ?? defaultNavigationIcon;
  const resolvedNavigationTitle = navigationTitle ?? defaultNavigationTitle;

  const command = useCommand({
    actions,
    navigationIcon: resolvedNavigationIcon,
    navigationTitle: resolvedNavigationTitle,
    ...hookOptions,
  });

  const commandRef = useRef(command);
  useEffect(() => {
    commandRef.current = command;
  }, [command]);

  // Navigation methods
  const push = useCallback((view: ViewItem) => {
    setViewStack((stack) => [...stack, view]);
  }, []);

  const pop = useCallback(() => {
    setViewStack((stack) => {
      if (stack.length === 0) return stack;
      return stack.slice(0, -1);
    });
    // Re-focus input after pop
    setTimeout(() => {
      if (viewStack.length <= 1) {
        commandRef.current.focusInput();
      }
    }, 0);
  }, [viewStack.length]);

  const replace = useCallback((view: ViewItem) => {
    setViewStack((stack) => {
      if (stack.length === 0) return [view];
      return [...stack.slice(0, -1), view];
    });
  }, []);

  const popToRoot = useCallback(() => {
    setViewStack([]);
    setTimeout(() => {
      commandRef.current.focusInput();
    }, 0);
  }, []);

  // Update current view's accessory
  const setCurrentAccessory = useCallback((newAccessory: React.ReactElement | null) => {
    setViewStack((stack) => {
      if (stack.length === 0) return stack;
      const newStack = [...stack];
      newStack[newStack.length - 1] = {
        ...newStack[newStack.length - 1],
        accessory: newAccessory,
      };
      return newStack;
    });
  }, []);

  // Navigation context value
  const navigationValue = useMemo<NavigationContextValue>(
    () => ({
      push,
      pop,
      replace,
      popToRoot,
      setAccessory: setCurrentAccessory,
      depth: viewStack.length,
      focusRef,
    }),
    [push, pop, replace, popToRoot, setCurrentAccessory, viewStack.length]
  );

  const enhancedResultsProps = {
    ...command.resultsProps,
    onRender: command.resultsProps.onRender,
  };

  // Auto-focus
  useEffect(() => {
    if (!autoFocus) return;
    const focusOnMount = async () => {
      await attemptFocusWithRetry(() => commandRef.current, {
        maxRetries: 7,
        initialDelay: 30,
        backoffMultiplier: 2,
      });
    };
    focusOnMount();
  }, [autoFocus]);

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

  // Handle ESC and Backspace
  useEffect(() => {
    if (!rua) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // If view stack has items, ESC should pop
      if (viewStack.length > 0 && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        pop();
        return;
      }

      if (event.key !== "Escape" && event.key !== "Backspace") {
        return;
      }

      const isAtRoot = !command.rootActionId;
      const isSearchEmpty = !command.search || command.search.trim() === "";

      if (event.key === "Escape" && isAtRoot && isSearchEmpty) {
        event.preventDefault();
        event.stopPropagation();
        rua.hideWindow().catch(console.error);
        return;
      }

      if (event.key === "Backspace" && isAtRoot && isSearchEmpty) {
        const target = event.target as HTMLElement;
        if (target.tagName === "INPUT" && (target as HTMLInputElement).value === "") {
          event.preventDefault();
          event.stopPropagation();
          if (viewStack.length > 0) {
            pop();
            return;
          }
          rua.ui.close().catch(console.error);
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [rua, command.rootActionId, command.search, viewStack.length, pop]);

  const showEmptyState = command.results.length === 0 && !command.search && actions.length === 0;
  const isInputDisabled = viewStack.length > 0;
  const currentView = viewStack.length > 0 ? viewStack[viewStack.length - 1] : null;

  // Build footer actions for current view
  const currentFooterActions = useMemo(() => {
    if (!currentView) return undefined;

    return (_current: any, changeVisible: () => void) => {
      const close = () => {
        changeVisible();
        pop();
      };
      if (currentView.footerActions) {
        return currentView.footerActions(close);
      }
      return [
        {
          id: "back",
          name: "Back",
          icon: "←",
          perform: close,
        },
      ];
    };
  }, [currentView, pop]);

  // Resolve current accessory
  const currentAccessory = currentView ? currentView.accessory : accessory;

  // Calculate split widths for details panel
  const splitWidths = useMemo(() => calculateSplitWidths(detailsRatio), [detailsRatio]);

  // Empty state element for details panel
  const emptyStateElement = useMemo(() => {
    if (!emptyState) return undefined;
    return emptyState({ search: command.search, actions });
  }, [emptyState, command.search, actions]);

  // Render content area (list or split layout)
  const renderContent = () => {
    if (currentView) {
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
          {currentView.component}
        </div>
      );
    }

    if (showEmptyState && emptyState) {
      return (
        <div
          className={`flex flex-col items-center justify-center px-6 py-12 overflow-auto ${emptyStateClassName}`}
          style={{ flex: 1, minHeight: 0 }}
        >
          {emptyState({ search: command.search, actions })}
        </div>
      );
    }

    // Split layout with details panel
    if (isShowDetails) {
      return (
        <div className="command-split-layout">
          <div className="command-split-list" style={{ width: splitWidths.listWidth }}>
            {layout === "grid" ? (
              <GridRender
                {...enhancedResultsProps}
                columns={columns}
                itemHeight={itemHeight}
                gap={gap}
              />
            ) : (
              <ResultsRender {...enhancedResultsProps} />
            )}
          </div>
          <DetailsPanel
            action={command.activeAction}
            emptyView={emptyStateElement}
            className="details-panel"
            style={{ width: splitWidths.detailsWidth }}
          />
        </div>
      );
    }

    // Normal layout without details panel
    return layout === "grid" ? (
      <GridRender {...enhancedResultsProps} columns={columns} itemHeight={itemHeight} gap={gap} />
    ) : (
      <ResultsRender {...enhancedResultsProps} />
    );
  };

  return (
    <NavigationContext.Provider value={navigationValue}>
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
            {renderContent()}
          </div>

          <ActiveFooter
            currentView={currentView}
            currentFooterActions={currentFooterActions}
            command={command}
            accessory={currentAccessory}
            focusRef={focusRef}
          />
        </Background>
      </Container>
    </NavigationContext.Provider>
  );
}

interface ActiveFooterProps {
  currentView?: ViewItem | null;
  command?: UseCommandReturn;
  accessory?: React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | null;
  currentFooterActions?: (current: any, changeVisible: () => void) => Action[];
  focusRef?: React.RefObject<HTMLElement>;
}

function ActiveFooter({
  currentView,
  command,
  accessory,
  currentFooterActions,
  focusRef,
}: ActiveFooterProps) {
  const footerProps =
    currentView && currentFooterActions
      ? { ...command.footerProps, actions: currentFooterActions, mainInputRef: focusRef }
      : command.footerProps;

  return <Footer {...footerProps} accessory={accessory} />;
}
