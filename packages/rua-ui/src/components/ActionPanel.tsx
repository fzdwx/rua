import { ActionPanelProps } from '../types';

/**
 * ActionPanel component for displaying actions in a footer or inline
 * Uses command-footer class for footer position to match main interface styling
 */
export function ActionPanel({ actions, position = 'footer' }: ActionPanelProps) {
  if (actions.length === 0) return null;

  // Use command-footer class for footer position to ensure consistency with main interface
  const containerClass = position === 'footer' 
    ? 'action-panel command-footer' 
    : 'action-panel action-panel-inline';

  return (
    <div className={containerClass}>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onAction}
          className="action-panel-button"
          title={action.shortcut ? formatShortcut(action.shortcut) : undefined}
        >
          {action.icon && <span className="action-icon">{action.icon}</span>}
          <span className="action-title">{action.title}</span>
          {action.shortcut && (
            <span className="action-shortcut">{formatShortcut(action.shortcut)}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function formatShortcut(shortcut: { key: string; modifiers?: string[] }): string {
  const mods = shortcut.modifiers || [];
  const modStrings = mods.map((mod) => {
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
