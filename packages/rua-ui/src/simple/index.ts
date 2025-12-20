/**
 * Simplified API for rua-ui command palette
 *
 * This module provides high-level abstractions over the low-level command components,
 * making it easier to create command palettes with less boilerplate code.
 *
 * @packageDocumentation
 */

// Core hook
export { useCommand } from "./useCommand"

// Pre-built component
export { CommandPalette } from "./CommandPalette"

// Utility functions
export {
  getActiveAction,
  createQuerySubmitHandler,
  createFooterActionsGetter,
  createFooterContentRenderer,
  mergeActions,
  attemptFocusWithRetry,
} from "./utils"

// Utility types
export type {
  FocusRetryOptions,
} from "./utils"

// Types
export type {
  UseCommandOptions,
  UseCommandReturn,
  CommandPaletteProps,
  OnQuerySubmitCallback,
  OnSelectCallback,
  OnQueryActionEnterCallback,
  EmptyStateRenderer,
  CustomItemRenderer,
  FooterContentRenderer,
} from "./types"
