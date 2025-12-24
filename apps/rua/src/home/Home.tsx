import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Action, ActionImpl, Input, useActionStore, useMatches} from "@fzdwx/ruaui";
import {useApplications} from "@/hooks/useApplications";
import {useBuiltInActions} from "@/hooks/useBuiltInActions";
import {useExtensionActionsForPalette} from "@/hooks/useExtensionActions";
import {useFileSearch} from "@/hooks/useFileSearch";
import {useTheme} from "@/hooks/useTheme";
import {Icon} from "@iconify/react";
import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {useActionUsage} from "@/hooks/useActionUsage";
import {DefaultView} from "./DefaultView";
import {AnimatePresence} from "motion/react";
import React from "react";
import {AnimatedView} from "./AnimatedView";
import {createViewConfigs} from "./viewConfig";
import {ViewContext} from "./viewContext";
import {useExtensionSystem} from "@/contexts/ExtensionSystemContext";
import {Background, Container} from "@fzdwx/ruaui";

export default function Home() {
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [resultHandleEvent, setResultHandleEvent] = useState(true);
  const [focusQueryInput, setFocusQueryInput] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh of built-in actions
  const [extensionInputHidden, setExtensionInputHidden] = useState(false); // Extension-controlled input visibility
  const inputRef = useRef<HTMLInputElement>(null);
  const lastActiveMainActionRef = useRef<ActionImpl | null>(null); // Store last active main action for passing data to edit action
  const {theme, toggleTheme} = useTheme();
  const {incrementUsage} = useActionUsage();
  const {notifyActivate, notifyDeactivate, notifySearchChange} = useExtensionSystem();

  // Initialize action store
  const {useRegisterActions, setRootActionId, setActiveIndex, state} = useActionStore();

  // Load applications and convert to actions
  const {actions: applicationActions} = useApplications();

  // Get built-in actions (static actions like translate)
  // refreshKey forces re-computation when quick links are updated
  const builtInActions = useBuiltInActions(setRootActionId, setSearch, refreshKey);

  // Get extension actions
  const extensionActions = useExtensionActionsForPalette(setRootActionId, setSearch);

  // Combine all actions (built-in actions first for priority, then extensions, then applications)
  const allActions = useMemo(() => {
    return [...builtInActions, ...extensionActions, ...applicationActions];
  }, [builtInActions, extensionActions, applicationActions]);

  // Handle window focus - respect disableSearchFocus flag
  useEffect(() => {
    let unlistenFocus: (() => void) | undefined;
    getCurrentWebviewWindow()
      .listen("tauri://focus", () => {
        // Check if current root action has disableSearchFocus flag
        const currentAction = allActions.find((a) => a.id === state.rootActionId);
        const shouldFocusSearch = !currentAction?.disableSearchFocus;

        if (shouldFocusSearch) {
          inputRef.current?.focus();
        }
      })
      .then((unlistenFn) => {
        unlistenFocus = unlistenFn;
      });
    return () => {
      unlistenFocus?.();
    };
  }, [state.rootActionId, allActions]);

  // Handle window show/hide - notify extensions
  useEffect(() => {
    let unlistenShow: (() => void) | undefined;
    let unlistenHide: (() => void) | undefined;

    // Listen for window-shown event (custom event from control_server)
    getCurrentWebviewWindow()
      .listen("rua://window-shown", () => {
        document.body.focus();
        notifyActivate();
      })
      .then((unlistenFn) => {
        unlistenShow = unlistenFn;
      });

    // Listen for window-hidden event (custom event from control_server)
    getCurrentWebviewWindow()
      .listen("rua://window-hidden", () => {
        notifyDeactivate();
      })
      .then((unlistenFn) => {
        unlistenHide = unlistenFn;
      });

    return () => {
      unlistenShow?.();
      unlistenHide?.();
    };
  }, [notifyActivate, notifyDeactivate]);

  // Notify extensions when search input changes
  useEffect(() => {
    // Only notify when in main view (no root action selected)
    if (state.rootActionId === null) {
      notifySearchChange(search);
    }
  }, [search, state.rootActionId, notifySearchChange]);

  // Register actions when they change
  useRegisterActions(allActions, [allActions]);

  // Use the matches hook for search and filtering
  const {results: appResults} = useMatches(search, state.actions, state.rootActionId, {
    minScoreThreshold: 100,
    maxResults: 10,
    debug: false,
  });

  // Count non-section items (sections are strings)
  const actualResultsCount = useMemo(() => {
    return appResults.filter((item) => typeof item !== "string").length;
  }, [appResults]);

  // Auto file search when app results are less than 5
  const handleFileOpen = useCallback(async () => {
    // Hide window after opening file
    await getCurrentWebviewWindow().hide();
  }, []);

  const {fileActions} = useFileSearch({
    enabled: search.trim().length > 1,
    query: search,
    currentResultsCount: actualResultsCount,
    threshold: 10,
    maxResults: 5,
    onFileOpen: handleFileOpen,
  });

  // Merge file search results with app results
  const results = useMemo(() => {
    if (fileActions.length === 0) {
      return appResults;
    }

    // Merge results: app results first, then file results
    return [...appResults, ...(fileActions as any)];
  }, [appResults, fileActions]);

  // Get the currently active main action
  const activeMainAction = useMemo(() => {
    if (results.length === 0 || state.activeIndex < 0) {
      return null;
    }
    const activeItem = results[state.activeIndex];
    if (typeof activeItem === "string") {
      return null;
    }
    const action = activeItem as ActionImpl;
    // Store the last active main action for potential use in edit mode
    if (action && action.kind === "quick-link") {
      lastActiveMainActionRef.current = action;
    }
    return action;
  }, [results, state.activeIndex]);

  const currentRootAction = useMemo(() => {
    // let actions = state.actions;
    if (state.rootActionId === null) {
      return null;
    }
    let actions = allActions.filter((v) => {
      return v.id === state.rootActionId;
    });
    return actions[0] as ActionImpl;
  }, [allActions, state.rootActionId]);

  // Get action configuration from registered actions
  const getActionConfig = useCallback(
    (rootActionId: string | null): Partial<Action> | null => {
      if (rootActionId === null) {
        return null;
      }

      // Find registered action
      const registeredAction = allActions.find((v) => v.id === rootActionId);
      if (registeredAction) {
        return {
          hideSearchBox: registeredAction.hideSearchBox,
          disableSearchFocus: registeredAction.disableSearchFocus,
        };
      }

      return null;
    },
    [allActions]
  );

  const actionConfig = useMemo(() => {
    return getActionConfig(state.rootActionId);
  }, [getActionConfig, state.rootActionId]);

  // Handle query submission from Input component
  const handleQuerySubmit = (query: string, actionId: string) => {
    // Track usage when entering action via query submission
    incrementUsage(actionId);
    // Enter the action and set search to the query
    setRootActionId(actionId);
    setSearch(query);
  };

  // Handle action loading state change
  const handleActionLoadingChange = useCallback((loading: boolean) => {
    setActionLoading(loading);
  }, []);

  // Handle query action Enter key press
  const handleQueryActionEnter = useCallback(() => {
    setFocusQueryInput(true);
    // Reset the flag after a short delay to allow re-triggering
    setTimeout(() => {
      setFocusQueryInput(false);
    }, 100);
  }, []);

  // Generate footer actions based on active main action
  const getFooterActions = useCallback(
    (current: string | ActionImpl | null, changeVisible: () => void) => {
      const footerActions = [];

      // Add action-specific footer actions if available
      // Only process if current is an ActionImpl (not string)
      if (current && typeof current !== "string" && current.footerAction) {
        const actionSpecificFooterActions = current.footerAction(changeVisible);
        footerActions.push(...actionSpecificFooterActions);
      }

      return footerActions;
    },
    []
  );

  // Generate settings actions
  const getSettingsActions = useCallback(() => {
    return [
      {
        id: "toggle-theme",
        name: "Toggle Theme",
        subtitle: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
        icon: (
          <Icon
            icon={theme === "dark" ? "tabler:sun" : "tabler:moon"}
            style={{fontSize: "20px"}}
          />
        ),
        keywords: "theme dark light mode",
        perform: () => {
          toggleTheme();
        },
      },
    ];
  }, [theme, toggleTheme]);

  // View configurations
  const viewConfigs = useMemo(() => {
    return createViewConfigs(setRootActionId, setSearch, setRefreshKey, inputRef);
  }, [setRootActionId, setSearch, setRefreshKey]);

  // Find matching view config
  const matchedViewConfig = useMemo(() => {
    return viewConfigs.find((config) => config.match(state.rootActionId));
  }, [viewConfigs, state.rootActionId]);

  return (
    <Container>
      <Background>
        {/* Hide Input when current action has hideSearchBox set to true or extension requests it */}
        {!actionConfig?.hideSearchBox && !extensionInputHidden && (
          <Input
            value={search}
            onValueChange={setSearch}
            currentRootActionId={state.rootActionId}
            onCurrentRootActionIdChange={(id) => {
              setRootActionId(id);
              // Only focus search box if we're returning to main view (id is null)
              // or if the target action doesn't have disableSearchFocus
              if (id === null) {
                inputRef.current?.focus();
              } else {
                const targetConfig = getActionConfig(id);
                if (!targetConfig?.disableSearchFocus) {
                  inputRef.current?.focus();
                }
              }
            }}
            actions={state.actions}
            activeAction={activeMainAction}
            onQuerySubmit={handleQuerySubmit}
            setResultHandleEvent={setResultHandleEvent}
            loading={actionLoading}
            disableTabFocus={actionConfig?.disableSearchFocus ?? false}
            focusQueryInput={focusQueryInput}
            inputRefSetter={(ref) => {
              inputRef.current = ref;
            }}
            defaultPlaceholder="Type a command or search…"
          />
        )}

        {/* Main content area with flex: 1 to prevent footer from being squeezed */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <AnimatePresence mode="wait">
            {matchedViewConfig ? (
              <AnimatedView viewKey={matchedViewConfig.key}>
                {React.createElement(
                  matchedViewConfig.component,
                  matchedViewConfig.getProps({
                    rootActionId: state.rootActionId,
                    search,
                    currentRootAction,
                    lastActiveMainAction: lastActiveMainActionRef.current,
                    handleActionLoadingChange,
                    setRootActionId,
                    setSearch,
                    setRefreshKey,
                    inputRef,
                    results,
                    activeIndex: state.activeIndex,
                    activeMainAction,
                    resultHandleEvent,
                    theme,
                    getFooterActions,
                    getSettingsActions,
                    setActiveIndex,
                    setResultHandleEvent,
                    onQueryActionEnter: handleQueryActionEnter,
                    extensionInputHidden,
                    setExtensionInputHidden,
                  } as ViewContext)
                )}
              </AnimatedView>
            ) : (
              <DefaultView
                key="default"
                search={search}
                results={results}
                activeIndex={state.activeIndex}
                rootActionId={state.rootActionId}
                activeMainAction={activeMainAction}
                resultHandleEvent={resultHandleEvent}
                inputRef={inputRef}
                theme={theme}
                setSearch={setSearch}
                setActiveIndex={setActiveIndex}
                setRootActionId={setRootActionId}
                setResultHandleEvent={setResultHandleEvent}
                getFooterActions={getFooterActions}
                getSettingsActions={getSettingsActions}
                onQueryActionEnter={handleQueryActionEnter}
              />
            )}
          </AnimatePresence>
        </div>
      </Background>
    </Container>
  );
}
