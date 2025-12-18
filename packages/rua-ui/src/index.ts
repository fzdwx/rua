// =============================================================================
// COMPONENTS
// =============================================================================

// List component and sub-components
export { List } from "./components/List";
export {
  ListItemComponent,
  ListSectionComponent,
  ListEmptyView,
  isListItemComponent,
  isListSectionComponent,
  isListEmptyViewComponent,
} from "./components/ListSubComponents";

// Form component and sub-components
export { Form } from "./components/Form";

// Detail component and sub-components
export {
  Detail,
  isDetailMetadataComponent,
  isDetailMetadataLabelComponent,
  isDetailMetadataLinkComponent,
  isDetailMetadataTagListComponent,
  isDetailMetadataSeparatorComponent,
} from "./components/Detail";

// Grid component and sub-components
export {
  Grid,
  GridItemComponent,
  GridSectionComponent,
  GridEmptyView,
  isGridItemComponent,
  isGridSectionComponent,
  isGridEmptyViewComponent,
} from "./components/Grid";

// ActionPanel component and Action components
export {
  ActionPanel,
  Action,
  formatShortcut,
  useNavigation,
  NavigationProvider,
} from "./components/ActionPanel";

// SearchInput component
export { SearchInput } from "./components/SearchInput";

// ListItem component (renamed to avoid conflict with ListItem type)
export { ListItem as ListItemRenderer } from "./components/ListItem";
export type { ListItemProps } from "./components/ListItem";

// =============================================================================
// ICON SYSTEM
// =============================================================================

export {
  Icon,
  Image,
  IconComponent,
  createIcon,
  isBuiltInIcon,
  isExternalSource,
} from "./components/Icon";
export type { IconProps, BuiltInIcon, ImageMask } from "./components/Icon";

// =============================================================================
// TOAST API
// =============================================================================

export { Toast, ToastStyle, ToastProvider, showToast, useToast } from "./components/Toast";
export type { ToastOptions, ToastInstance, ToastAction, ToastStyleType } from "./components/Toast";

// =============================================================================
// FOCUS UTILITIES
// =============================================================================

export {
  attemptFocusWithRetry,
  calculateBackoffDelay,
  type FocusRetryOptions,
} from "./components/List";

// =============================================================================
// HOOKS
// =============================================================================

export { useSearch } from "./hooks/useSearch";
export { useKeyboard } from "./hooks/useKeyboard";
export { useActions } from "./hooks/useActions";
export { useRuaTheme } from "./hooks/useRuaTheme";
export {
  useShortcut,
  useShortcuts,
  useShortcutRegistry,
  getShortcutRegistry,
} from "./hooks/useShortcuts";
export type { ShortcutHandler, UseShortcutOptions } from "./hooks/useShortcuts";

// Navigation (also exported from ActionPanel for backward compatibility)
export {
  useNavigation as useNavigationHook,
  NavigationProvider as NavigationProviderComponent,
  NavigationContext,
} from "./hooks/useNavigation";
export type { NavigationContextValue, NavigationProviderProps } from "./hooks/useNavigation";

// =============================================================================
// TYPES
// =============================================================================

// Core types
export type {
  Action as LegacyAction,
  Accessory,
  KeyboardShortcut,
  NavigationValue,
  FilteringOptions,
} from "./types";

// List types
export type {
  ListItem,
  ListSection,
  ListProps,
  ListItemComponentProps,
  ListSectionComponentProps,
  ListEmptyViewProps,
} from "./types";

// Detail types
export type {
  DetailProps,
  DetailMetadataProps,
  DetailMetadataLabelProps,
  DetailMetadataLinkProps,
  DetailMetadataTagListProps,
  DetailMetadataTagListItemProps,
  DetailMetadataSeparatorProps,
} from "./types";

// Form types
export type {
  FormProps,
  FormTextFieldProps,
  FormTextAreaProps,
  FormPasswordFieldProps,
  FormDropdownProps,
  FormDropdownItemProps,
  FormDropdownSectionProps,
  FormDatePickerProps,
  FormFilePickerProps,
  FormCheckboxProps,
} from "./types";

// ActionPanel types (Raycast-aligned)
export type {
  ActionPanelProps,
  ActionPanelSectionProps,
  ActionPanelSubmenuProps,
  ActionProps,
  ActionCopyToClipboardProps,
  ActionOpenInBrowserProps,
  ActionPushProps,
  ActionPopProps,
} from "./types";

// Grid types
export type {
  GridProps,
  GridItemProps,
  GridSectionProps,
  GridEmptyViewProps,
  GridItemContent,
  GridItemAccessory,
} from "./types";

// Toast types (re-exported from types for consistency)
export type {
  ToastStyleType as ToastStyleEnum,
  ToastAction as ToastActionType,
  ToastOptions as ToastOptionsType,
  ToastInstance as ToastInstanceType,
} from "./types";

// Utility component types
export type { SearchInputProps, ListItemRendererProps } from "./types";

// Re-export Action component types from ActionPanel for convenience
export type {
  ActionPanelSectionProps as ActionSectionProps,
  ActionPanelSubmenuProps as ActionSubmenuProps,
} from "./components/ActionPanel";
