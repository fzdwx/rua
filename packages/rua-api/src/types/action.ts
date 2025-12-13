/**
 * Plugin Action Types
 * 
 * Defines the structure for plugin-registered actions.
 * Based on Requirements 4.1
 */

import type { ReactNode, ComponentType } from 'react';

/**
 * Context provided to action perform functions
 */
export interface ActionContext {
  /** Current search query */
  query: string;
  /** Root action ID if in nested context */
  rootActionId?: string;
  /** Navigate to a specific action */
  setRootActionId: (actionId: string | null) => void;
  /** Close the command palette */
  close: () => void;
}

/**
 * Props passed to custom view components
 */
export interface ViewProps {
  /** Current search query */
  query: string;
  /** Update the search query */
  setQuery: (query: string) => void;
  /** Root action ID */
  rootActionId: string;
  /** Navigate to a different action */
  setRootActionId: (actionId: string | null) => void;
  /** Close the command palette */
  close: () => void;
}

/**
 * Plugin action definition
 * 
 * Actions are the primary way plugins extend the command palette.
 * Each action can have an execute function and/or a custom view.
 */
export interface PluginAction {
  /** 
   * Action ID (will be prefixed with plugin ID)
   * e.g., "search" becomes "my-plugin.search"
   */
  id: string;
  
  /** Display name shown in command palette */
  name: string;
  
  /** Additional search keywords */
  keywords?: string;
  
  /** Icon - can be iconify name or React node */
  icon?: string | ReactNode;
  
  /** Subtitle shown below the name */
  subtitle?: string;
  
  /** Keyboard shortcut (e.g., ["$mod", "k"]) */
  shortcut?: string[];
  
  /** Section/category for grouping */
  section?: string;
  
  /** 
   * Parent action ID for nested actions
   * Use full ID including plugin prefix
   */
  parent?: string;
  
  /** Priority for sorting (higher = more prominent) */
  priority?: number;

  /**
   * Execute function called when action is selected
   * If not provided, action must have a view
   */
  perform?: (context: ActionContext) => void | Promise<void>;

  /**
   * Custom view component rendered when action is activated
   */
  view?: ComponentType<ViewProps>;

  // View configuration
  /** Enable query input in view mode */
  query?: boolean;
  /** Hide the search box when view is active */
  hideSearchBox?: boolean;
  /** Disable auto-focus on search box */
  disableSearchFocus?: boolean;
}

/**
 * Internal action representation with full namespaced ID
 */
export interface RegisteredAction extends Omit<PluginAction, 'id'> {
  /** Full namespaced ID (plugin-id.action-id) */
  id: string;
  /** Original action ID without namespace */
  originalId: string;
  /** Plugin ID that registered this action */
  pluginId: string;
}

/**
 * Action created from manifest definition
 * Used when loading actions from plugin manifest
 */
export interface ManifestDerivedAction {
  /** Full namespaced ID (plugin-id.action-name) */
  id: string;
  /** Display title */
  name: string;
  /** Action mode */
  mode: 'view' | 'command';
  /** Search keywords */
  keywords?: string;
  /** Icon */
  icon?: string;
  /** Subtitle */
  subtitle?: string;
  /** Keyboard shortcut */
  shortcut?: string[];
  /** Plugin ID */
  pluginId: string;
  /** Original action name from manifest */
  actionName: string;
  /** UI entry URL (for view mode) */
  uiEntry?: string;
  /** Script path (for command mode) */
  script?: string;
}
