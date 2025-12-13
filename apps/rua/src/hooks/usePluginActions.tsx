/**
 * Hook to provide plugin actions for the command palette
 * 
 * Converts plugin-derived actions to the Action format used by the command palette.
 */

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { Action } from '@/command';
import { usePluginSystem, type ManifestDerivedAction } from '@/contexts/PluginSystemContext';

/**
 * Convert a ManifestDerivedAction to an Action for the command palette
 */
function convertToAction(
  pluginAction: ManifestDerivedAction,
  setRootActionId: (id: string | null) => void
): Action {
  return {
    id: pluginAction.id,
    name: pluginAction.name,
    keywords: pluginAction.keywords,
    icon: pluginAction.icon ? (
      <Icon icon={pluginAction.icon} style={{ fontSize: '20px' }} />
    ) : (
      <Icon icon="tabler:puzzle" style={{ fontSize: '20px' }} />
    ),
    subtitle: pluginAction.subtitle,
    shortcut: pluginAction.shortcut,
    section: 'Plugins',
    perform: () => {
      if (pluginAction.mode === 'view') {
        // For view mode, set root action to show the plugin view
        setRootActionId(pluginAction.id);
      } else if (pluginAction.mode === 'command' && pluginAction.script) {
        // For command mode, execute the script
        // TODO: Implement script execution via Tauri
        console.log(`Execute script: ${pluginAction.script}`);
      }
    },
  };
}

/**
 * Hook to get plugin actions converted to Action format
 */
export function usePluginActionsForPalette(
  setRootActionId: (id: string | null) => void
): Action[] {
  const { pluginActions, initialized } = usePluginSystem();

  return useMemo(() => {
    if (!initialized) return [];

    return pluginActions.map((action) => 
      convertToAction(action, setRootActionId)
    );
  }, [pluginActions, initialized, setRootActionId]);
}

/**
 * Hook to get the manage plugins action
 */
export function useManagePluginsAction(
  setRootActionId: (id: string | null) => void
): Action {
  return useMemo(() => ({
    id: 'manage-plugins',
    name: 'Manage Plugins',
    keywords: 'plugins extensions addons',
    icon: <Icon icon="tabler:puzzle" style={{ fontSize: '20px' }} />,
    subtitle: 'View and manage installed plugins',
    section: 'Settings',
    perform: () => {
      setRootActionId('manage-plugins');
    },
  }), [setRootActionId]);
}
