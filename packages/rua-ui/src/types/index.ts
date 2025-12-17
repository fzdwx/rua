import { ReactElement, ReactNode } from 'react';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  modifiers?: Array<'cmd' | 'ctrl' | 'alt' | 'shift'>;
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
  items: ListItem[];
}

/**
 * Props for the List component
 */
export interface ListProps {
  searchPlaceholder?: string;
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
}

/**
 * Props for the Form component
 */
export interface FormProps {
  title?: string;
  actions?: Action[];
  onSubmit?: (values: Record<string, any>) => void;
  children: ReactNode;
}

/**
 * Props for the Detail component
 */
export interface DetailProps {
  title?: string;
  markdown?: string;
  children?: ReactNode;
  actions?: Action[];
}

/**
 * Props for the ActionPanel component
 */
export interface ActionPanelProps {
  actions: Action[];
  position?: 'footer' | 'inline';
}

/**
 * Navigation context value
 */
export interface NavigationValue {
  push: (view: ReactElement) => void;
  pop: () => void;
  canPop: boolean;
}
