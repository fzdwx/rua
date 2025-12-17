import React, { ReactElement, ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import type { KeyboardShortcut } from '../types';
import { useShortcut } from '../hooks/useShortcuts';
import { useNavigation, NavigationProvider, NavigationContext } from '../hooks/useNavigation';
import type { NavigationContextValue, NavigationProviderProps } from '../hooks/useNavigation';

// Re-export navigation components for backward compatibility
export { useNavigation, NavigationProvider, NavigationContext };
export type { NavigationContextValue, NavigationProviderProps };

// Extend Window interface for rua API
declare global {
  interface Window {
    rua?: {
      clipboard: {
        writeText: (text: string) => Promise<void>;
        readText: () => Promise<string>;
      };
      shell: {
        execute: (program: string, args: string[]) => Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number | null }>;
      };
      os: {
        platform: () => Promise<'windows' | 'linux' | 'darwin'>;
      };
    };
  }
}

/**
 * Props for the ActionPanel component (Raycast-aligned)
 */
export interface ActionPanelProps {
  /** @deprecated Use children-based API instead */
  actions?: LegacyAction[];
  /** @deprecated Use children-based API instead */
  position?: 'footer' | 'inline';
  /** Panel title displayed in the header */
  title?: string;
  /** Action or ActionPanel.Section children */
  children?: ReactNode;
}

/**
 * Legacy action interface for backward compatibility
 */
interface LegacyAction {
  id: string;
  title: string;
  icon?: ReactElement;
  shortcut?: KeyboardShortcut;
  onAction: () => void | Promise<void>;
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
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const mods = shortcut.modifiers || [];
  // Order: cmd → ctrl → alt → shift → key
  const orderedMods = ['cmd', 'ctrl', 'alt', 'shift'].filter(m => 
    mods.includes(m as 'cmd' | 'ctrl' | 'alt' | 'shift')
  );
  
  const modStrings = orderedMods.map((mod) => {
    switch (mod) {
      case 'cmd':
        return '⌘';
      case 'ctrl':
        return 'Ctrl';
      case 'alt':
        return 'Alt';
      case 'shift':
        return 'Shift';
      default:
        return mod;
    }
  });
  return [...modStrings, shortcut.key.toUpperCase()].join('+');
}

/**
 * Internal component for legacy action button with shortcut support
 */
function LegacyActionButton({ action }: { action: LegacyAction }) {
  const onActionRef = useRef(action.onAction);
  
  useEffect(() => {
    onActionRef.current = action.onAction;
  }, [action.onAction]);
  
  const handleAction = useCallback(async () => {
    try {
      await onActionRef.current();
    } catch (error) {
      console.error('[ActionPanel] Error executing action:', error);
    }
  }, []);
  
  // Register keyboard shortcut
  useShortcut(action.shortcut, handleAction);
  
  return (
    <button
      onClick={handleAction}
      className="action-panel-button"
      title={action.shortcut ? formatShortcut(action.shortcut) : undefined}
    >
      {action.icon && <span className="action-icon">{action.icon}</span>}
      <span className="action-title">{action.title}</span>
      {action.shortcut && (
        <span className="action-shortcut">{formatShortcut(action.shortcut)}</span>
      )}
    </button>
  );
}

/**
 * ActionPanel component for displaying actions
 * Supports both legacy array-based API and new children-based API
 */
export function ActionPanel({ actions, position = 'footer', title, children }: ActionPanelProps) {
  // Use children-based API if children are provided
  const hasChildren = React.Children.count(children) > 0;
  
  if (!hasChildren && (!actions || actions.length === 0)) {
    return null;
  }

  const containerClass = position === 'footer' 
    ? 'action-panel command-footer' 
    : 'action-panel action-panel-inline';

  // Legacy array-based rendering
  if (!hasChildren && actions) {
    return (
      <div className={containerClass}>
        {actions.map((action) => (
          <LegacyActionButton key={action.id} action={action} />
        ))}
      </div>
    );
  }

  // New children-based rendering
  return (
    <div className={containerClass}>
      {title && <div className="action-panel-header">{title}</div>}
      <div className="action-panel-content">
        {children}
      </div>
    </div>
  );
}

/**
 * ActionPanel.Section component for grouping actions
 */
function ActionPanelSection({ title, children }: ActionPanelSectionProps) {
  return (
    <div className="action-panel-section">
      {title && <div className="action-panel-section-title">{title}</div>}
      <div className="action-panel-section-content">
        {children}
      </div>
    </div>
  );
}

/**
 * ActionPanel.Submenu component for nested menus
 */
function ActionPanelSubmenu({ title, icon, shortcut, children }: ActionPanelSubmenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="action-panel-submenu">
      <button
        className="action-panel-button action-panel-submenu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title={shortcut ? formatShortcut(shortcut) : undefined}
      >
        {icon && <span className="action-icon">{icon}</span>}
        <span className="action-title">{title}</span>
        <span className="action-submenu-indicator">▶</span>
        {shortcut && (
          <span className="action-shortcut">{formatShortcut(shortcut)}</span>
        )}
      </button>
      {isOpen && (
        <div className="action-panel-submenu-content">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Standalone Action component
 */
export function Action({ title, icon, shortcut, onAction }: ActionProps) {
  const onActionRef = useRef(onAction);
  
  // Keep the ref up to date
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);
  
  const handleAction = useCallback(async () => {
    try {
      await onActionRef.current();
    } catch (error) {
      console.error('[Action] Error executing action:', error);
    }
  }, []);
  
  // Register keyboard shortcut
  useShortcut(shortcut, handleAction);
  
  return (
    <button
      className="action-panel-button"
      onClick={handleAction}
      title={shortcut ? formatShortcut(shortcut) : undefined}
    >
      {icon && <span className="action-icon">{icon}</span>}
      <span className="action-title">{title}</span>
      {shortcut && (
        <span className="action-shortcut">{formatShortcut(shortcut)}</span>
      )}
    </button>
  );
}

/**
 * Action.CopyToClipboard component
 */
function ActionCopyToClipboard({ 
  title = 'Copy to Clipboard', 
  content, 
  shortcut,
  onCopy 
}: ActionCopyToClipboardProps) {
  const handleCopy = async () => {
    try {
      const textContent = String(content);
      
      // Try to use rua clipboard API if available
      if (typeof window !== 'undefined' && window.rua?.clipboard) {
        await window.rua.clipboard.writeText(textContent);
      } else {
        // Fallback to browser clipboard API
        await navigator.clipboard.writeText(textContent);
      }
      
      onCopy?.();
    } catch (error) {
      console.error('[Action.CopyToClipboard] Failed to copy:', error);
    }
  };
  
  return (
    <Action
      title={title}
      shortcut={shortcut}
      onAction={handleCopy}
    />
  );
}

/**
 * Action.OpenInBrowser component
 */
function ActionOpenInBrowser({ 
  title = 'Open in Browser', 
  url, 
  shortcut 
}: ActionOpenInBrowserProps) {
  const handleOpen = async () => {
    try {
      // Try to use rua shell API if available
      if (typeof window !== 'undefined' && window.rua?.shell) {
        // Use xdg-open on Linux, open on macOS, start on Windows
        const platform = await window.rua.os.platform();
        let command: string;
        
        switch (platform) {
          case 'darwin':
            command = 'open';
            break;
          case 'windows':
            command = 'start';
            break;
          default:
            command = 'xdg-open';
        }
        
        await window.rua.shell.execute(command, [url]);
      } else {
        // Fallback to window.open
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('[Action.OpenInBrowser] Failed to open URL:', error);
      // Fallback to window.open on error
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <Action
      title={title}
      shortcut={shortcut}
      onAction={handleOpen}
    />
  );
}

/**
 * Action.Push component for navigation
 */
function ActionPush({ title, icon, shortcut, target }: ActionPushProps) {
  const { push } = useNavigation();
  
  const handlePush = () => {
    push(target);
  };
  
  return (
    <Action
      title={title}
      icon={icon}
      shortcut={shortcut}
      onAction={handlePush}
    />
  );
}

/**
 * Action.Pop component for navigation
 */
function ActionPop({ title = 'Go Back', icon, shortcut }: ActionPopProps) {
  const { pop, canPop } = useNavigation();
  
  const handlePop = () => {
    if (canPop) {
      pop();
    }
  };
  
  // Don't render if we can't pop
  if (!canPop) {
    return null;
  }
  
  return (
    <Action
      title={title}
      icon={icon}
      shortcut={shortcut}
      onAction={handlePop}
    />
  );
}

// Attach sub-components to ActionPanel
ActionPanel.Section = ActionPanelSection;
ActionPanel.Submenu = ActionPanelSubmenu;

// Attach sub-components to Action
Action.CopyToClipboard = ActionCopyToClipboard;
Action.OpenInBrowser = ActionOpenInBrowser;
Action.Push = ActionPush;
Action.Pop = ActionPop;
