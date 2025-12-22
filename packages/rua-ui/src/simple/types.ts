import type * as React from "react";
import type { Action, ActionId, ActionTree, ToastType } from "../command/types";
import type { ActionImpl } from "../command";

/**
 * Callback when a query is submitted (e.g., creating a new item)
 */
export type OnQuerySubmitCallback = (query: string, actionId: ActionId) => void | Promise<void>;

/**
 * Callback when an action is selected/executed
 */
export type OnSelectCallback = (action: ActionImpl) => void | Promise<void>;

/**
 * Callback when query action is entered (Tab pressed)
 */
export type OnQueryActionEnterCallback = () => void;

/**
 * Render function for empty state
 */
export type EmptyStateRenderer = (props: {
  search: string;
  actions: Action[];
}) => React.ReactElement;

/**
 * Custom item renderer function
 */
export type CustomItemRenderer = (action: ActionImpl, active: boolean) => React.ReactElement;

/**
 * Footer content renderer function
 */
export type FooterContentRenderer = (current: ActionImpl | null) => string | React.ReactElement;

/**
 * Options for useCommand hook
 */
export interface UseCommandOptions {
  /**
   * Array of actions to display in the command palette
   */
  actions: Action[];

  /**
   * Placeholder text for the search input
   * @default "Type a command or search..."
   */
  placeholder?: string;

  /**
   * Whether to show loading indicator in the input
   * @default false
   */
  loading?: boolean;

  /**
   * Callback when a query is submitted
   * Typically used for creating new items when using query actions
   */
  onQuerySubmit?: OnQuerySubmitCallback;

  /**
   * Callback when an action is selected
   * Note: This is called when action changes, not when it's executed
   */
  onSelect?: OnSelectCallback;

  /**
   * Callback when Tab is pressed on a query action
   * Can be used for additional side effects
   */
  onQueryActionEnter?: OnQueryActionEnterCallback;

  /**
   * Icon to display in the footer navigation
   * @default Uses the extension's current action icon from manifest, or active action's icon, or "✨"
   */
  navigationIcon?: string | React.ReactElement;

  /**
   * Title/content to display in the footer navigation
   * Can be a string or a function that receives the current action
   * @default Uses the extension's current action title from manifest, or active action's name/subtitle
   */
  navigationTitle?: string | FooterContentRenderer;

  /**
   * Function to generate footer actions for the current action
   * If not provided, uses the action's footerAction property
   */
  footerActions?: (current: ActionImpl | null, changeVisible: () => void) => Action[];

  /**
   * Settings actions to display in the footer settings menu
   */
  settingsActions?: Action[];

  /**
   * Custom item renderer
   * If not provided, uses RenderItem component
   */
  renderItem?: CustomItemRenderer;

  /**
   * External ref for the input element
   * Useful if you need direct access to the input
   */
  inputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * Return value from useCommand hook
 */
export interface UseCommandReturn {
  /**
   * Pre-processed props for Input component
   * Can be spread directly: <Input {...inputProps} />
   */
  inputProps: {
    value: string;
    onValueChange: (value: string) => void;
    actions: ActionTree;
    currentRootActionId: ActionId | null;
    onCurrentRootActionIdChange: (id: ActionId | null) => void;
    activeAction: ActionImpl | null;
    onQuerySubmit: (query: string, actionId: ActionId) => void;
    setResultHandleEvent: (enabled: boolean) => void;
    loading?: boolean;
    defaultPlaceholder?: string;
    focusQueryInput: boolean;
    inputRefSetter?: (ref: HTMLInputElement) => void;
  };

  /**
   * Pre-processed props for ResultsRender component
   * Can be spread directly: <ResultsRender {...resultsProps} />
   */
  resultsProps: {
    items: (ActionImpl | string)[];
    height: "auto";
    handleKeyEvent: boolean;
    setActiveIndex: (cb: number | ((currIndex: number) => number)) => void;
    search: string;
    setSearch: (value: string) => void;
    setRootActionId: (rootActionId: ActionId) => void;
    currentRootActionId: ActionId | null;
    activeIndex: number;
    onQueryActionEnter: () => void;
    onRender: (params: { item: ActionImpl | string; active: boolean }) => React.ReactElement;
  };

  /**
   * Pre-processed props for Footer component
   * Can be spread directly: <Footer {...footerProps} />
   */
  footerProps: {
    current: ActionImpl | null;
    icon: string | React.ReactElement;
    content: (current: ActionImpl | null) => string | React.ReactElement;
    actions: (current: ActionImpl | null, changeVisible: () => void) => Action[];
    settings?: Action[];
    mainInputRef?: React.RefObject<HTMLInputElement>;
    onSubCommandShow?: () => void;
    onSubCommandHide?: () => void;
  };

  // State accessors (for advanced usage)
  /**
   * Current search query
   */
  search: string;

  /**
   * Set search query
   */
  setSearch: (value: string) => void;

  /**
   * Currently active action (filtered to exclude section headers)
   */
  activeAction: ActionImpl | null;

  /**
   * Current active index in results
   */
  activeIndex: number;

  /**
   * Current root action ID (for nested navigation)
   */
  rootActionId: ActionId | null;

  /**
   * All search results (includes section headers as strings)
   */
  results: (ActionImpl | string)[];

  // Control methods
  /**
   * Reset all state to initial values
   */
  reset: () => void;

  /**
   * Focus the input element
   */
  focusInput: () => void;

  // Toast methods
  /**
   * Show a toast message in the footer area (Raycast style)
   * @param message - The message text to display
   * @param type - Toast type: 'success' (green dot) | 'failure' (red dot) | 'animated' (spinner)
   * @param duration - Auto-dismiss duration in ms. Default 3000. Set to 0 for persistent toast
   */
  showToast: (message: string, type: ToastType, duration?: number) => void;

  /**
   * Hide the current toast
   */
  hideToast: () => void;
}

/**
 * Layout mode for results display
 */
export type LayoutMode = "list" | "grid";

/**
 * Grid configuration options
 */
export interface GridConfig {
  /** Number of columns in grid layout. @default 4 */
  columns?: number;
  /** Item height in pixels. @default 140 */
  itemHeight?: number;
  /** Gap between grid items in pixels. @default 12 */
  gap?: number;
}

/**
 * Split ratio type for details panel layout
 */
export type DetailsRatio = "1:1" | "1:2" | "1:3" | "2:3";

/**
 * Props for CommandPalette component
 */
export interface CommandPaletteProps extends UseCommandOptions {
  /**
   * Additional className for the container
   */
  className?: string;

  /**
   * Additional className for the empty state container
   */
  emptyStateClassName?: string;

  /**
   * Whether to auto-focus the input on mount
   */
  autoFocus?: boolean;

  /**
   * Whether to show the footer
   * @default true
   */
  showFooter?: boolean;

  /**
   * Custom accessory element to display on the right side of the footer
   */
  accessory?: React.ReactElement;

  /**
   * Custom empty state renderer
   * Shown when there are no actions and no search
   * Also used as empty view in details panel when action has no details
   */
  emptyState?: EmptyStateRenderer;

  /**
   * Whether to show the details panel on the right side
   * @default false
   */
  isShowDetails?: boolean;

  /**
   * Split ratio between list and details panel
   * Format: "list:details" (e.g., "1:2" means list takes 1/3, details takes 2/3)
   * @default "1:2"
   */
  detailsRatio?: DetailsRatio;

  /**
   * Layout mode for displaying results
   * @default "list"
   */
  layout?: LayoutMode;

  /**
   * Grid configuration (only used when layout="grid")
   */
  gridConfig?: GridConfig;

  /**
   * Optional Rua API instance for window control
   * When provided, enables:
   * - Window hiding on ESC/Backspace at root level with empty search
   * - Default navigation values from manifest action info
   */
  rua?: {
    hideWindow(): Promise<void>;
    ui: {
      /** close action back to main view */
      close(): Promise<void>;
      /** Get initial search value passed from main app */
      getInitialSearch(): Promise<string>;
    };
    on(
      event: "activate" | "deactivate" | "action-triggered" | "theme-change",
      handler: (data: unknown) => void
    ): void;

    /** Unregister event handler */
    off(
      event: "activate" | "deactivate" | "action-triggered" | "theme-change",
      handler: (data: unknown) => void
    ): void;

    /** Extension metadata including current action info from manifest */
    extension?: {
      id: string;
      name: string;
      version: string;
      /** Extension directory path (for resolving relative asset paths) */
      path?: string;
      /** Current action info from manifest (populated when running in view mode) */
      currentAction?: {
        /** Action name from manifest */
        name: string;
        /** Display title from manifest */
        title: string;
        /** Icon path or iconify icon name */
        icon?: string;
        /** Subtitle from manifest */
        subtitle?: string;
      };
    };
  };
}
