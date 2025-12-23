import * as React from "react";
import {ActionImpl} from "./action";
import type { RecentUsageRecord, QueryAffinityRecord } from "./search/types";

// Export types from search for use in other modules
export type { RecentUsageRecord, QueryAffinityRecord } from "./search/types";

export type ActionId = string;

export type Priority = number;

export type ActionSection =
  | string
  | {
  name: string;
  priority: Priority;
};

export type Action = {
  id: ActionId;
  name: string;
  shortcut?: string[];
  keywords?: string | string[]; // String (legacy) or array of keywords for search
  section?: ActionSection;
  icon?: string | React.ReactElement | React.ReactNode;
  subtitle?: string;
  perform?: (currentActionImpl: ActionImpl) => any;
  parent?: ActionId;
  priority?: Priority;
  item?: any;
  kind?: string;
  query?: boolean; // If true, shows a query input box when action is active
  footerAction?: (changeVisible: () => void) => Action[]; // Footer actions specific to this main action

  // Usage tracking and ranking fields
  usageCount?: number; // Number of times this action has been used
  lastUsedTime?: number; // Last usage timestamp in milliseconds
  recentUsage?: RecentUsageRecord[]; // Recent 7-day usage records
  queryAffinity?: Record<string, QueryAffinityRecord>; // Query-specific affinity scores
  stableBias?: number; // User-configured stable bias for ranking adjustment

  badge?: string; // Badge text to display on the right side of the action
  disableSearchFocus?: boolean; // If true, prevents automatic focus to search box when this action is active
  hideSearchBox?: boolean; // If true, hides the search box when this action is active
  uiEntry?: string; // UI entry path for extension view mode actions
  /**
   * Function that returns a React component to display in the details panel.
   * Receives the action item as parameter for dynamic content.
   * Only used when CommandPalette's isShowDetails is true.
   */
  details?: (item?: any) => React.ReactElement;
};

export type ActionStore = Record<ActionId, ActionImpl>;

export type ActionTree = Record<string, ActionImpl>;

export interface ActionGroup {
  name: string;
  actions: ActionImpl[];
}

export interface KBarOptions {
  animations?: {
    enterMs?: number;
    exitMs?: number;
  };
  callbacks?: {
    onOpen?: () => void;
    onClose?: () => void;
    onQueryChange?: (searchQuery: string) => void;
    onSelectAction?: (action: ActionImpl) => void;
  };
  /**
   * `disableScrollBarManagement` ensures that kbar will not
   * manipulate the document's `margin-right` property when open.
   * By default, kbar will add additional margin to the document
   * body when opened in order to prevent any layout shift with
   * the appearance/disappearance of the scrollbar.
   */
  disableScrollbarManagement?: boolean;
  /**
   * `disableDocumentLock` disables the "document lock" functionality
   * of kbar, where the body element's scrollbar is hidden and pointer
   * events are disabled when kbar is open. This is useful if you're using
   * a custom modal component that has its own implementation of this
   * functionality.
   */
  disableDocumentLock?: boolean;
  enableHistory?: boolean;
  /**
   * `toggleShortcut` enables customizing which keyboard shortcut triggers
   * kbar. Defaults to "$mod+k" (cmd+k / ctrl+k)
   */
  toggleShortcut?: string;

  /**
   * `enableToggleShortcut` enables the keyboard shortcut for toggling kbar.
   */
  enableToggleShortcut?: boolean;

  /**
   * defaultShow will cause kbar to be open by default when the component
   * */
  defaultShow?: boolean;
}

export interface KBarProviderProps {
  actions?: Action[];
  options?: KBarOptions;
}

export interface KBarState {
  searchQuery: string;
  visualState: VisualState;
  actions: ActionTree;
  currentRootActionId?: ActionId | null;
  activeIndex: number;
  disabled: boolean;
}

export interface KBarQuery {
  setCurrentRootAction: (actionId?: ActionId | null) => void;
  setVisualState: (cb: ((vs: VisualState) => VisualState) | VisualState) => void;
  setSearch: (search: string) => void;
  registerActions: (actions: Action[]) => () => void;
  toggle: () => void;
  setActiveIndex: (cb: number | ((currIndex: number) => number)) => void;
  inputRefSetter: (el: HTMLInputElement) => void;
  getInput: () => HTMLInputElement;
  disable: (disable: boolean) => void;
}

export interface IKBarContext {
  getState: () => KBarState;
  query: KBarQuery;
  subscribe: (collector: <C>(state: KBarState) => C, cb: <C>(collected: C) => void) => void;
  options: KBarOptions;
}

export enum VisualState {
  animatingIn = "animating-in",
  showing = "showing",
  animatingOut = "animating-out",
  hidden = "hidden",
}

export interface HistoryItem {
  perform: () => any;
  negate: () => any;
}

export interface History {
  undoStack: HistoryItem[];
  redoStack: HistoryItem[];
  add: (item: HistoryItem) => HistoryItem;
  remove: (item: HistoryItem) => void;
  undo: (item?: HistoryItem) => void;
  redo: (item?: HistoryItem) => void;
  reset: () => void;
}

/**
 * Toast type determines the visual style of the toast (Raycast style)
 * - success: Green dot indicator
 * - failure: Red dot indicator
 * - animated: Spinning loading indicator
 */
export type ToastType = "success" | "failure" | "animated";

/**
 * Toast interface for displaying feedback messages in the Footer area
 */
export interface Toast {
  /** Unique identifier for the toast, used for animation keys */
  id: string;
  /** The message text to display */
  message: string | React.ReactElement;
  /** Type determines the indicator style (green dot, red dot, or spinner) */
  type: ToastType;
  /** Auto-dismiss duration in ms. Default 3000. Set to 0 for persistent toast */
  duration?: number;
}
