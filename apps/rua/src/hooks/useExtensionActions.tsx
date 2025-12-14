/**
 * Hook to provide extension actions for the command palette
 *
 * Converts extension-derived actions to the Action format used by the command palette.
 * Also includes dynamic actions registered by extensions at runtime.
 */

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { Action } from '@/command';
import { useExtensionSystem, type ManifestDerivedAction, type DynamicAction } from '@/contexts/ExtensionSystemContext';

/**
 * Convert a ManifestDerivedAction to an Action for the command palette
 */
function convertToAction(
  extensionAction: ManifestDerivedAction,
  setRootActionId: (id: string | null) => void,
  setSearch: (search: string) => void
): Action {
  return {
    id: extensionAction.id,
    name: extensionAction.name,
    keywords: extensionAction.keywords,
    icon: extensionAction.icon ? (
      <Icon icon={extensionAction.icon} style={{ fontSize: '20px' }} />
    ) : (
      <Icon icon="tabler:puzzle" style={{ fontSize: '20px' }} />
    ),
    subtitle: extensionAction.subtitle,
    shortcut: extensionAction.shortcut,
    section: 'Extensions',
    // Pass uiEntry for view mode actions
    uiEntry: extensionAction.uiEntry,
    // Store extensionId for routing
    item: { extensionId: extensionAction.extensionId },
    // Pass query flag for showing query input box
    query: extensionAction.query,
    perform: () => {
      if (extensionAction.mode === 'view') {
        // Clear search input when entering extension view
        setSearch("");
        // For view mode, set root action to show the extension view
        setRootActionId(extensionAction.id);
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
  extensions: { manifest: { id: string; rua: { ui?: { entry: string } } }; path: string }[],
  setRootActionId: (id: string | null) => void,
  setSearch: (search: string) => void
): Action {
  // Find the extension to get its UI entry
  const extension = extensions.find(p => p.manifest.id === extensionId);
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
    // Store extensionId for routing
    item: { extensionId: extensionId, isDynamic: true },
    perform: () => {
      if (dynamicAction.mode === 'view') {
        // Clear search input when entering extension view
        setSearch("");
        setRootActionId(fullId);
      }
    },
  };
}

/**
 * Hook to get extension actions converted to Action format
 * Includes both manifest-defined actions and dynamically registered actions
 */
export function useExtensionActionsForPalette(
  setRootActionId: (id: string | null) => void,
  setSearch: (search: string) => void
): Action[] {
  const { extensionActions, dynamicActions, extensions, initialized } = useExtensionSystem();

  return useMemo(() => {
    if (!initialized) return [];

    // Convert manifest actions
    const manifestActions = extensionActions.map((action) =>
      convertToAction(action, setRootActionId, setSearch)
    );

    // Convert dynamic actions
    const dynamicActionsList: Action[] = [];
    dynamicActions.forEach((actions, extensionId) => {
      for (const action of actions) {
        dynamicActionsList.push(
          convertDynamicToAction(extensionId, action, extensions, setRootActionId, setSearch)
        );
      }
    });

    const allActions = [...manifestActions, ...dynamicActionsList];
    console.log('[useExtensionActionsForPalette] actions:', allActions.length, 'manifest:', manifestActions.length, 'dynamic:', dynamicActionsList.length);
    return allActions;
  }, [extensionActions, dynamicActions, extensions, initialized, setRootActionId, setSearch]);
}
