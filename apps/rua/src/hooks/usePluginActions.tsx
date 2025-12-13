/**
 * Hook to provide plugin actions for the command palette
 * 
 * Converts plugin-derived actions to the Action format used by the command palette.
 * Also includes dynamic actions registered by extensions at runtime.
 */

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { Action } from '@/command';
import { usePluginSystem, type ManifestDerivedAction, type DynamicAction } from '@/contexts/PluginSystemContext';

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
    section: 'Extensions',
    // Pass uiEntry for view mode actions
    uiEntry: pluginAction.uiEntry,
    // Store pluginId for routing
    item: { pluginId: pluginAction.pluginId },
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
 * Convert a DynamicAction to an Action for the command palette
 */
function convertDynamicToAction(
  extensionId: string,
  dynamicAction: DynamicAction,
  plugins: { manifest: { id: string; rua: { ui?: { entry: string } } }; path: string }[],
  setRootActionId: (id: string | null) => void
): Action {
  // Find the extension to get its UI entry
  const extension = plugins.find(p => p.manifest.id === extensionId);
  const uiEntry = extension?.manifest.rua.ui?.entry;
  const extPath = extension?.path;
  
  // Build full action ID with extension prefix
  const fullId = `${extensionId}.${dynamicAction.id}`;
  
  return {
    id: fullId,
    name: dynamicAction.name,
    keywords: dynamicAction.keywords?.join(' '),
    icon: dynamicAction.icon ? (
      <Icon icon={dynamicAction.icon} style={{ fontSize: '20px' }} />
    ) : (
      <Icon icon="tabler:sparkles" style={{ fontSize: '20px' }} />
    ),
    subtitle: dynamicAction.subtitle,
    section: 'Extensions',
    // Build uiEntry for view mode
    uiEntry: dynamicAction.mode === 'view' && uiEntry && extPath
      ? `${extPath}/${uiEntry}?action=${dynamicAction.id}`
      : undefined,
    // Store pluginId for routing
    item: { pluginId: extensionId, isDynamic: true },
    perform: () => {
      if (dynamicAction.mode === 'view') {
        setRootActionId(fullId);
      }
    },
  };
}

/**
 * Hook to get plugin actions converted to Action format
 * Includes both manifest-defined actions and dynamically registered actions
 */
export function usePluginActionsForPalette(
  setRootActionId: (id: string | null) => void
): Action[] {
  const { pluginActions, dynamicActions, plugins, initialized } = usePluginSystem();

  return useMemo(() => {
    if (!initialized) return [];

    // Convert manifest actions
    const manifestActions = pluginActions.map((action) => 
      convertToAction(action, setRootActionId)
    );
    
    // Convert dynamic actions
    const dynamicActionsList: Action[] = [];
    dynamicActions.forEach((actions, extensionId) => {
      for (const action of actions) {
        dynamicActionsList.push(
          convertDynamicToAction(extensionId, action, plugins, setRootActionId)
        );
      }
    });
    
    const allActions = [...manifestActions, ...dynamicActionsList];
    console.log('[usePluginActionsForPalette] actions:', allActions.length, 'manifest:', manifestActions.length, 'dynamic:', dynamicActionsList.length);
    return allActions;
  }, [pluginActions, dynamicActions, plugins, initialized, setRootActionId]);
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
