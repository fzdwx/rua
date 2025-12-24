import React, { useState, useMemo, useCallback, useRef } from "react";
import { useActionStore } from "../command/useActionStore";
import { useMatches } from "../command/useMatches";
import { RenderItem } from "../command/RenderItem";
import { GridItem } from "../command/GridItem";
import { showToast, hideToast } from "../command/toastStore";
import type { UseCommandOptions, UseCommandReturn } from "./types";
import { getActiveAction } from "./utils";

/**
 * Unified hook for managing command palette state and behavior
 *
 * This hook integrates useActionStore and useMatches, manages internal state,
 * and provides pre-processed props for Input, ResultsRender, and Footer components.
 *
 * @param options - Configuration options
 * @returns Command palette state and pre-processed component props
 *
 * @example
 * const command = useCommand({
 *   actions: myActions,
 *   placeholder: "Search...",
 *   onQuerySubmit: (query, actionId) => {
 *     if (actionId === "create") {
 *       createItem(query)
 *     }
 *   }
 * })
 *
 * return (
 *   <div>
 *     <Input {...command.inputProps} />
 *     <ResultsRender {...command.resultsProps} />
 *     <Footer {...command.footerProps} />
 *   </div>
 * )
 */
export function useCommand(options: UseCommandOptions): UseCommandReturn {
  const {
    actions,
    placeholder = "Type a command or search...",
    loading = false,
    onQuerySubmit,
    onQueryActionEnter,
    navigationIcon,
    navigationTitle,
    footerActions,
    settingsActions,
    renderItem,
    inputRef: externalInputRef,
    layout = "list",
    gridConfig,
  } = options;

  // Internal state
  const [search, setSearch] = useState("");
  const [resultHandleEvent, setResultHandleEvent] = useState(true);
  const [focusQueryInput, setFocusQueryInput] = useState(false);
  const internalInputRef = useRef<HTMLInputElement | null>(null);

  // Use external ref if provided, otherwise use internal
  const inputRef = externalInputRef || internalInputRef;

  // Action store management
  const { useRegisterActions, state, setActiveIndex, setRootActionId } = useActionStore();
  useRegisterActions(actions, [actions]);

  // Match results
  const { results } = useMatches(search, state.actions, state.rootActionId);

  // Active action (filtered to remove string section headers)
  const activeAction = useMemo(
    () => getActiveAction(results, state.activeIndex),
    [results, state.activeIndex]
  );

  // Query submit handler
  const handleQuerySubmit = useCallback(
    async (query: string, actionId: string) => {
      if (onQuerySubmit) {
        await onQuerySubmit(query, actionId);
      }
      // Clear search after submit
      setSearch("");
    },
    [onQuerySubmit]
  );

  // Query action enter handler (Tab press)
  const handleQueryActionEnter = useCallback(() => {
    setFocusQueryInput(true);
    setTimeout(() => setFocusQueryInput(false), 100);

    if (onQueryActionEnter) {
      onQueryActionEnter();
    }
  }, [onQueryActionEnter]);

  // Default footer content renderer
  const defaultFooterContent = useCallback(
    (current: any) => {
      if (!current) return "Select an action";
      if (typeof navigationTitle === "string") return navigationTitle;
      if (typeof navigationTitle === "function") return navigationTitle(current);

      // Default: show subtitle or instruction for query actions
      if (current.query) return "Type your query and press Enter";
      return current.subtitle || current.name;
    },
    [navigationTitle]
  );

  // Resolve navigation icon - uses provided value, active action's icon, or fallback
  const resolvedNavigationIcon = useMemo((): string | React.ReactElement => {
    if (navigationIcon !== undefined) return navigationIcon;
    // Only use activeAction.icon if it's a string or ReactElement (not other ReactNode types)
    if (activeAction?.icon !== undefined && activeAction.icon !== null) {
      const icon = activeAction.icon;
      if (typeof icon === "string" || React.isValidElement(icon)) {
        return icon;
      }
    }
    return "✨";
  }, [navigationIcon, activeAction]);

  // Default footer actions getter
  const defaultFooterActions = useCallback(
    (current: any, changeVisible: () => void) => {
      if (footerActions) {
        return footerActions(current, changeVisible);
      }

      // Get footer actions from the action itself
      if (current?.footerAction) {
        return current.footerAction(changeVisible);
      }

      return [];
    },
    [footerActions]
  );

  // Default section header renderer
  const defaultSectionRenderer = useCallback(
    (item: string) => (
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--gray11)]">
        {item}
      </div>
    ),
    []
  );

  // Default item renderer
  const defaultItemRenderer = useCallback(
    (item: any, active: boolean) => {
      if (typeof item === "string") {
        return defaultSectionRenderer(item);
      }

      if (renderItem) {
        return renderItem(item, active);
      }

      // Use default RenderItem component
      return (
        <RenderItem action={item} active={active} currentRootActionId={state.rootActionId ?? ""} />
      );
    },
    [renderItem, state.rootActionId, defaultSectionRenderer]
  );

  // Default grid item renderer (for grid layout)
  const defaultGridItemRenderer = useCallback(
    (item: any, active: boolean) => {
      // Skip section headers in grid mode
      if (typeof item === "string") {
        return null;
      }

      // Use default GridItem component
      return (
        <GridItem action={item} active={active} currentRootActionId={state.rootActionId ?? ""} />
      );
    },
    [state.rootActionId]
  );

  // Choose renderer based on layout
  const itemRenderer = useMemo(() => {
    return layout === "grid" ? defaultGridItemRenderer : defaultItemRenderer;
  }, [layout, defaultGridItemRenderer, defaultItemRenderer]);

  // Reset function
  const reset = useCallback(() => {
    setSearch("");
    setRootActionId(null);
    setActiveIndex(0);
  }, [setRootActionId, setActiveIndex]);

  // Focus input function
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  // Stable callbacks for footer to avoid unnecessary re-renders
  const handleSubCommandShow = useCallback(() => {
    setResultHandleEvent(false);
  }, []);

  const handleSubCommandHide = useCallback(() => {
    setResultHandleEvent(true);
  }, []);

  // Build return object with pre-processed props
  return {
    // Pre-processed props for components
    inputProps: {
      value: search,
      onValueChange: setSearch,
      actions: state.actions,
      currentRootActionId: state.rootActionId,
      onCurrentRootActionIdChange: setRootActionId,
      activeAction,
      onQuerySubmit: handleQuerySubmit,
      setResultHandleEvent,
      loading,
      defaultPlaceholder: placeholder,
      focusQueryInput,
      inputRefSetter: (ref: HTMLInputElement) => {
        if (inputRef && "current" in inputRef) {
          inputRef.current = ref;
        }
      },
    },

    resultsProps: {
      items: results,
      height: "auto" as const,
      handleKeyEvent: resultHandleEvent,
      setActiveIndex,
      search,
      setSearch,
      setRootActionId,
      currentRootActionId: state.rootActionId,
      activeIndex: state.activeIndex,
      onQueryActionEnter: handleQueryActionEnter,
      onRender: ({ item, active }) => itemRenderer(item, active),
    },

    footerProps: {
      current: activeAction,
      icon: resolvedNavigationIcon,
      content: defaultFooterContent,
      actions: defaultFooterActions,
      settings: settingsActions,
      mainInputRef: inputRef,
      onSubCommandShow: handleSubCommandShow,
      onSubCommandHide: handleSubCommandHide,
    },

    // State accessors (for advanced usage)
    search,
    setSearch,
    activeAction,
    activeIndex: state.activeIndex,
    rootActionId: state.rootActionId,
    results,

    // Control methods
    reset,
    focusInput,

    // Toast methods (re-exported from toastStore for convenience)
    showToast,
    hideToast,
  };
}
