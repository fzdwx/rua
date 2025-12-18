import { ReactElement, ReactNode } from "react";

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  modifiers?: Array<"cmd" | "ctrl" | "alt" | "shift">;
}

/**
 * Action that can be performed on a list item or in an action panel
 */
export interface Action {
  id: string;
  title: string;
  icon?: ReactElement;
  shortcut?: KeyboardShortcut;
  onAction: () => void | Promise<void>;
}

/**
 * Accessory item displayed on the right side of a list item
 */
export interface Accessory {
  text?: string;
  icon?: ReactElement;
  tooltip?: string;
}

/**
 * Individual item in a list
 */
export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactElement;
  keywords?: string[];
  accessories?: Accessory[];
  actions?: Action[];
}

/**
 * Section grouping for list items
 */
export interface ListSection {
  title?: string;
  subtitle?: string;
  items: ListItem[];
}

/**
 * Props for List.Item component (Raycast-aligned)
 */
export interface ListItemComponentProps {
  /** Unique identifier for the item */
  id: string;
  /** Primary text displayed for the item */
  title: string;
  /** Secondary text displayed below the title */
  subtitle?: string;
  /** Icon displayed on the left side of the item */
  icon?: ReactElement;
  /** Additional search terms for filtering */
  keywords?: string[];
  /** Accessories displayed on the right side */
  accessories?: Accessory[];
  /** ActionPanel to display when item is selected */
  actions?: ReactElement;
  /** Detail view to display in split view mode */
  detail?: ReactElement;
}

/**
 * Props for List.Section component (Raycast-aligned)
 */
export interface ListSectionComponentProps {
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** List.Item children */
  children: ReactNode;
}

/**
 * Props for List.EmptyView component (Raycast-aligned)
 */
export interface ListEmptyViewProps {
  /** Icon to display */
  icon?: ReactElement;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** ActionPanel to display */
  actions?: ReactElement;
}

/**
 * Filtering configuration for List/Grid components
 */
export interface FilteringOptions {
  keepSectionOrder?: boolean;
}

/**
 * Props for the List component
 */
export interface ListProps {
  /** @deprecated Use searchBarPlaceholder instead */
  searchPlaceholder?: string;
  /** Placeholder text for the search bar */
  searchBarPlaceholder?: string;
  items?: ListItem[];
  sections?: ListSection[];
  onSearch?: (query: string) => void;
  onSelect?: (item: ListItem) => void;
  enablePinyin?: boolean;
  isLoading?: boolean;
  emptyView?: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: Action[];
  /** Initial search value. If not provided, will be fetched from rua API */
  initialSearch?: string;
  /** Title displayed in the navigation bar */
  navigationTitle?: string;
  /** Whether to show a detail panel alongside the list */
  isShowingDetail?: boolean;
  /** Control built-in filtering behavior. Set to false to disable, or provide options */
  filtering?: boolean | FilteringOptions;
  /** Whether to throttle search input */
  throttle?: boolean;
  /** Accessory component to display in the search bar */
  searchBarAccessory?: ReactNode;
  /** Children components (List.Item, List.Section) */
  children?: ReactNode;
}

/**
 * Props for the Form component
 */
export interface FormProps {
  /** Form title */
  title?: string;
  /** Actions available for this form */
  actions?: Action[];
  /** Callback when form is submitted */
  onSubmit?: (values: Record<string, any>) => void;
  /** Form field children */
  children: ReactNode;
  /** Title displayed in the navigation bar */
  navigationTitle?: string;
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  /** Whether to enable draft saving */
  enableDrafts?: boolean;
}

/**
 * Props for Form.TextField component (Raycast-aligned)
 */
export interface FormTextFieldProps {
  /** Unique identifier for the field */
  id: string;
  /** Field title/label */
  title?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Default value for uncontrolled mode */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Error message to display */
  error?: string;
  /** Info text to display below the field */
  info?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when field loses focus */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Whether to auto-focus the field */
  autoFocus?: boolean;
}

/**
 * Props for Form.TextArea component (Raycast-aligned)
 */
export interface FormTextAreaProps {
  /** Unique identifier for the field */
  id: string;
  /** Field title/label */
  title?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Default value for uncontrolled mode */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Error message to display */
  error?: string;
  /** Info text to display below the field */
  info?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when field loses focus */
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  /** Whether to auto-focus the field */
  autoFocus?: boolean;
  /** Number of rows */
  rows?: number;
  /** Whether to enable markdown preview */
  enableMarkdownPreview?: boolean;
}

/**
 * Props for Form.PasswordField component (Raycast-aligned)
 */
export interface FormPasswordFieldProps {
  /** Unique identifier for the field */
  id: string;
  /** Field title/label */
  title?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Default value for uncontrolled mode */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Error message to display */
  error?: string;
  /** Info text to display below the field */
  info?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when field loses focus */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Whether to auto-focus the field */
  autoFocus?: boolean;
}

/**
 * Props for Form.Dropdown component (Raycast-aligned)
 */
export interface FormDropdownProps {
  /** Unique identifier for the field */
  id: string;
  /** Field title/label */
  title?: string;
  /** Controlled value */
  value?: string;
  /** Default value for uncontrolled mode */
  defaultValue?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Error message to display */
  error?: string;
  /** Info text to display below the field */
  info?: string;
  /** Dropdown.Item or Dropdown.Section children */
  children?: ReactNode;
  /** Legacy items array for backward compatibility */
  items?: Array<{ label: string; value: string }>;
}

/**
 * Props for Form.Dropdown.Item component
 */
export interface FormDropdownItemProps {
  /** Item value */
  value: string;
  /** Display title */
  title: string;
  /** Icon to display */
  icon?: ReactElement;
}

/**
 * Props for Form.Dropdown.Section component
 */
export interface FormDropdownSectionProps {
  /** Section title */
  title?: string;
  /** Dropdown.Item children */
  children: ReactNode;
}

/**
 * Props for Form.DatePicker component (Raycast-aligned)
 */
export interface FormDatePickerProps {
  /** Unique identifier for the field */
  id: string;
  /** Field title/label */
  title?: string;
  /** Controlled value */
  value?: Date;
  /** Default value for uncontrolled mode */
  defaultValue?: Date;
  /** Minimum selectable date */
  min?: Date;
  /** Maximum selectable date */
  max?: Date;
  /** Type of date picker */
  type?: "date" | "datetime";
  /** Callback when value changes */
  onChange?: (date: Date | null) => void;
  /** Error message to display */
  error?: string;
  /** Info text to display below the field */
  info?: string;
}

/**
 * Props for Form.FilePicker component (Raycast-aligned)
 */
export interface FormFilePickerProps {
  /** Unique identifier for the field */
  id: string;
  /** Field title/label */
  title?: string;
  /** Whether to allow multiple file selection */
  allowMultipleSelection?: boolean;
  /** Whether directories can be selected */
  canChooseDirectories?: boolean;
  /** Whether files can be selected */
  canChooseFiles?: boolean;
  /** Allowed file extensions (e.g., ['png', 'jpg']) */
  allowedFileTypes?: string[];
  /** Controlled value */
  value?: string[];
  /** Default value for uncontrolled mode */
  defaultValue?: string[];
  /** Callback when value changes */
  onChange?: (files: string[]) => void;
  /** Error message to display */
  error?: string;
  /** Info text to display below the field */
  info?: string;
}

/**
 * Props for Form.Checkbox component (Raycast-aligned)
 */
export interface FormCheckboxProps {
  /** Unique identifier for the field */
  id: string;
  /** Checkbox label */
  label: string;
  /** Controlled value */
  value?: boolean;
  /** Default value for uncontrolled mode */
  defaultValue?: boolean;
  /** Callback when value changes */
  onChange?: (value: boolean) => void;
  /** Info text to display below the field */
  info?: string;
}

/**
 * Props for the Detail component
 */
export interface DetailProps {
  /** Title displayed in the detail view */
  title?: string;
  /** Markdown content to render */
  markdown?: string;
  /** Custom content to render */
  children?: ReactNode;
  /** Actions available for this detail view */
  actions?: Action[];
  /** Title displayed in the navigation bar */
  navigationTitle?: string;
  /** Whether the detail view is in a loading state */
  isLoading?: boolean;
  /** Metadata component to display in a sidebar */
  metadata?: ReactElement;
}

/**
 * Props for Detail.Metadata component
 */
export interface DetailMetadataProps {
  /** Metadata items (Label, Link, TagList, Separator) */
  children: ReactNode;
}

/**
 * Props for Detail.Metadata.Label component
 */
export interface DetailMetadataLabelProps {
  /** Label title */
  title: string;
  /** Label text value */
  text?: string;
  /** Icon to display */
  icon?: ReactElement;
}

/**
 * Props for Detail.Metadata.Link component
 */
export interface DetailMetadataLinkProps {
  /** Link title */
  title: string;
  /** URL target */
  target: string;
  /** Display text for the link */
  text: string;
}

/**
 * Props for Detail.Metadata.TagList component
 */
export interface DetailMetadataTagListProps {
  /** TagList title */
  title: string;
  /** TagList.Item children */
  children: ReactNode;
}

/**
 * Props for Detail.Metadata.TagList.Item component
 */
export interface DetailMetadataTagListItemProps {
  /** Tag text */
  text: string;
  /** Tag color */
  color?: string;
}

/**
 * Props for Detail.Metadata.Separator component
 */
export interface DetailMetadataSeparatorProps {}

/**
 * Props for the ActionPanel component (Raycast-aligned)
 */
export interface ActionPanelProps {
  /** @deprecated Use children-based API instead */
  actions?: Action[];
  /** @deprecated Use children-based API instead */
  position?: "footer" | "inline";
  /** Panel title displayed in the header */
  title?: string;
  /** Action or ActionPanel.Section children */
  children?: ReactNode;
}

/**
 * Props for ActionPanel.Section component
 */
export interface ActionPanelSectionProps {
  /** Section title */
  title?: string;
  /** Action children */
  children: ReactNode;
}

/**
 * Props for ActionPanel.Submenu component
 */
export interface ActionPanelSubmenuProps {
  /** Submenu title */
  title: string;
  /** Icon to display */
  icon?: ReactElement;
  /** Keyboard shortcut */
  shortcut?: KeyboardShortcut;
  /** Action children */
  children: ReactNode;
}

/**
 * Props for standalone Action component
 */
export interface ActionProps {
  /** Action title */
  title: string;
  /** Icon to display */
  icon?: ReactElement;
  /** Keyboard shortcut */
  shortcut?: KeyboardShortcut;
  /** Callback when action is triggered */
  onAction: () => void | Promise<void>;
}

/**
 * Props for Action.CopyToClipboard component
 */
export interface ActionCopyToClipboardProps {
  /** Action title (defaults to "Copy to Clipboard") */
  title?: string;
  /** Content to copy */
  content: string | number;
  /** Keyboard shortcut */
  shortcut?: KeyboardShortcut;
  /** Callback after copy */
  onCopy?: () => void;
}

/**
 * Props for Action.OpenInBrowser component
 */
export interface ActionOpenInBrowserProps {
  /** Action title (defaults to "Open in Browser") */
  title?: string;
  /** URL to open */
  url: string;
  /** Keyboard shortcut */
  shortcut?: KeyboardShortcut;
}

/**
 * Props for Action.Push component
 */
export interface ActionPushProps {
  /** Action title */
  title: string;
  /** Icon to display */
  icon?: ReactElement;
  /** Keyboard shortcut */
  shortcut?: KeyboardShortcut;
  /** Target view to push */
  target: ReactElement;
}

/**
 * Props for Action.Pop component
 */
export interface ActionPopProps {
  /** Action title (defaults to "Go Back") */
  title?: string;
  /** Icon to display */
  icon?: ReactElement;
  /** Keyboard shortcut */
  shortcut?: KeyboardShortcut;
}

/**
 * Navigation context value
 */
export interface NavigationValue {
  /** Push a new view onto the navigation stack */
  push: (view: ReactElement) => void;
  /** Pop the current view from the navigation stack */
  pop: () => void;
  /** Whether there are views to pop (stack is not empty) */
  canPop: boolean;
  /** Current navigation title */
  navigationTitle?: string;
  /** Set the navigation title */
  setNavigationTitle: (title: string) => void;
}

/**
 * Grid item content configuration
 */
export interface GridItemContent {
  /** Image source (URL, file path, or base64) */
  source: string;
  /** Tint color to apply to the image */
  tintColor?: string;
  /** Tooltip text */
  tooltip?: string;
}

/**
 * Grid item accessory configuration
 */
export interface GridItemAccessory {
  /** Icon to display */
  icon?: ReactElement;
  /** Tooltip text */
  tooltip?: string;
}

/**
 * Props for Grid.Item component
 */
export interface GridItemProps {
  /** Unique identifier for the item */
  id: string;
  /** Main visual content */
  content: GridItemContent;
  /** Title text displayed below the content */
  title?: string;
  /** Subtitle text displayed below the title */
  subtitle?: string;
  /** Additional search terms for filtering */
  keywords?: string[];
  /** Accessory displayed on the item */
  accessory?: GridItemAccessory;
  /** ActionPanel to display when item is selected */
  actions?: ReactElement;
}

/**
 * Props for Grid.Section component
 */
export interface GridSectionProps {
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Aspect ratio for items in this section */
  aspectRatio?: "1" | "3/2" | "2/3" | "4/3" | "3/4" | "16/9" | "9/16";
  /** Number of columns for this section */
  columns?: number;
  /** How content fits within the grid item */
  fit?: "contain" | "fill";
  /** Inset/padding for items in this section */
  inset?: "small" | "medium" | "large";
  /** Grid.Item children */
  children: ReactNode;
}

/**
 * Props for Grid.EmptyView component
 */
export interface GridEmptyViewProps {
  /** Icon to display */
  icon?: ReactElement;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** ActionPanel to display */
  actions?: ReactElement;
}

/**
 * Props for the Grid component
 */
export interface GridProps {
  /** Number of columns in the grid */
  columns?: number;
  /** Inset/padding for grid items */
  inset?: "small" | "medium" | "large";
  /** Aspect ratio for grid items */
  aspectRatio?: "1" | "3/2" | "2/3" | "4/3" | "3/4" | "16/9" | "9/16";
  /** How content fits within the grid item */
  fit?: "contain" | "fill";
  /** Placeholder text for the search bar */
  searchBarPlaceholder?: string;
  /** Control built-in filtering behavior */
  filtering?: boolean | FilteringOptions;
  /** Whether the grid is in a loading state */
  isLoading?: boolean;
  /** Title displayed in the navigation bar */
  navigationTitle?: string;
  /** Callback when search text changes */
  onSearchTextChange?: (text: string) => void;
  /** Callback when selection changes */
  onSelectionChange?: (id: string | null) => void;
  /** Currently selected item ID */
  selectedItemId?: string;
  /** Whether to throttle search input */
  throttle?: boolean;
  /** Grid.Item, Grid.Section, or Grid.EmptyView children */
  children?: ReactNode;
  /** Show back button in search bar */
  showBackButton?: boolean;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Actions available for this grid */
  actions?: Action[];
}

/**
 * Toast style enum values
 */
export type ToastStyleType = "success" | "failure" | "animated";

/**
 * Toast action configuration
 */
export interface ToastAction {
  /** Action title */
  title: string;
  /** Callback when action is triggered */
  onAction: () => void;
  /** Keyboard shortcut */
  shortcut?: KeyboardShortcut;
}

/**
 * Toast options for showToast function
 */
export interface ToastOptions {
  /** Toast style (Success, Failure, Animated) */
  style?: ToastStyleType;
  /** Toast title (required) */
  title: string;
  /** Optional message/description */
  message?: string;
  /** Primary action button */
  primaryAction?: ToastAction;
  /** Secondary action button */
  secondaryAction?: ToastAction;
}

/**
 * Toast instance returned by showToast
 */
export interface ToastInstance {
  /** Hide the toast */
  hide: () => void;
  /** Update toast title */
  title: string;
  /** Update toast message */
  message?: string;
  /** Update toast style */
  style?: ToastStyleType;
}

/**
 * Props for SearchInput component
 */
export interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to auto-focus the input */
  autoFocus?: boolean;
  /** Whether the search is in a loading state */
  loading?: boolean;
  /** Whether to show a back button */
  showBackButton?: boolean;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Ref to the input element */
  inputRef?: React.Ref<HTMLInputElement | null>;
}

/**
 * Props for ListItem renderer component
 */
export interface ListItemRendererProps {
  /** The list item data */
  item: ListItem;
  /** Whether this item is currently active/selected */
  active: boolean;
  /** Callback when item is clicked */
  onClick?: () => void;
  /** Callback when pointer moves over item */
  onPointerMove?: () => void;
  /** Callback when pointer is pressed on item */
  onPointerDown?: () => void;
}
