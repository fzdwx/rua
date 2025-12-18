/**
 * Hook to provide extension actions for the command palette
 *
 * Converts extension-derived actions to the Action format used by the command palette.
 * Also includes dynamic actions registered by extensions at runtime.
 */

import { useMemo } from "react";
import { Icon } from "@iconify/react";
import type { Action, ActionId } from "@/command";
import {
  useExtensionSystem,
  type ManifestDerivedAction,
  type DynamicAction,
} from "@/contexts/ExtensionSystemContext";
import { notifyActionTriggered } from "@/extension/background-executor.ts";
import { ActionIcon } from "@/components/ActionIcon";
import { useActionUsage } from "@/contexts/ActionUsageContext.tsx";

/**
 * Convert a ManifestDerivedAction to an Action for the command palette
 */
function convertToAction(
  extensionAction: ManifestDerivedAction,
  extensionPath: string | undefined,
  setRootActionId: (id: string | null) => void,
  setSearch: (search: string) => void,
  incrementUsage: (actionId: ActionId) => void,
  getUsageCount: (actionId: ActionId) => number
): Action {
  return {
    id: extensionAction.id,
    name: extensionAction.name,
    keywords: extensionAction.keywords,
    icon: extensionAction.icon ? (
      <ActionIcon icon={extensionAction.icon} extensionPath={extensionPath} size="20px" />
    ) : (
      <Icon icon="tabler:puzzle" style={{ fontSize: "20px" }} />
    ),
    subtitle: extensionAction.subtitle,
    shortcut: extensionAction.shortcut,
    // section: 'Extensions',
    // Pass uiEntry for view mode actions
    uiEntry: extensionAction.uiEntry,
    // Store extensionId for routing
    item: { extensionId: extensionAction.extensionId },
    // Pass query flag for showing query input box
    query: extensionAction.query,
    // Auto-hide search box for view mode extensions
    hideSearchBox: extensionAction.mode === "view",
    usageCount: getUsageCount(extensionAction.id),
    perform: () => {
      incrementUsage(extensionAction.id);
      if (extensionAction.mode === "view") {
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
  extensions: {
    manifest: { id: string; rua: { ui?: { entry: string } } };
    path: string;
  }[],
  setRootActionId: (id: string | null) => void,
  setSearch: (search: string) => void,
  incrementUsage: (actionId: ActionId) => void,
  getUsageCount: (actionId: ActionId) => number
): Action {
  // Find the extension to get its UI entry
  const extension = extensions.find((p) => p.manifest.id === extensionId);
  const uiEntry = extension?.manifest.rua.ui?.entry;
  const extPath = extension?.path;

  // Build full action ID with extension prefix
  const fullId = `${extensionId}.${dynamicAction.id}`;

  return {
    id: fullId,
    name: dynamicAction.name,
    keywords: dynamicAction.keywords?.join(","),
    icon: dynamicAction.icon ? (
      <ActionIcon icon={dynamicAction.icon} extensionPath={extPath} size="20px" />
    ) : (
      <Icon icon="tabler:sparkles" style={{ fontSize: "20px" }} />
    ),
    subtitle: dynamicAction.subtitle,
    // section: dynamicAction.section ? dynamicAction.section : 'Extensions',
    // Build uiEntry for view mode
    uiEntry:
      dynamicAction.mode === "view" && uiEntry && extPath
        ? `${extPath}/${uiEntry}?action=${dynamicAction.id}`
        : undefined,
    // Store extensionId for routing
    item: { extensionId: extensionId, isDynamic: true },
    // Auto-hide search box for view mode dynamic actions
    hideSearchBox: dynamicAction.mode === "view",
    usageCount: getUsageCount(fullId),
    badge: dynamicAction.badge,
    perform: () => {
      incrementUsage(fullId);
      if (dynamicAction.mode === "view") {
        // Clear search input when entering extension view
        setSearch("");
        setRootActionId(fullId);
      } else if (dynamicAction.mode === "command") {
        // For command mode, notify the extension's background script
        notifyActionTriggered(extensionId, dynamicAction.id);
        setSearch("");
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
  const { incrementUsage, getUsageCount } = useActionUsage();
  return useMemo(() => {
    if (!initialized) return [];

    // Convert manifest actions
    const manifestActions = extensionActions.map((action) => {
      const extension = extensions.find((p) => p.manifest.id === action.extensionId);
      return convertToAction(
        action,
        extension?.path,
        setRootActionId,
        setSearch,
        incrementUsage,
        getUsageCount
      );
    });

    // Convert dynamic actions
    const dynamicActionsList: Action[] = [];
    dynamicActions.forEach((actions, extensionId) => {
      for (const action of actions) {
        dynamicActionsList.push(
          convertDynamicToAction(
            extensionId,
            action,
            extensions,
            setRootActionId,
            setSearch,
            incrementUsage,
            getUsageCount
          )
        );
      }
    });

    const allActions = [...manifestActions, ...dynamicActionsList];
    return allActions;
  }, [extensionActions, dynamicActions, extensions, initialized, setRootActionId, setSearch]);
}
