/**
 * Extension View Wrapper Component
 *
 * Wraps ExtensionView to provide dev mode hot reload support
 * by connecting to the ExtensionSystemContext.
 */

import { useExtensionSystem } from "@/contexts/ExtensionSystemContext.tsx";
import { ExtensionView } from "./ExtensionView.tsx";
import type { DynamicAction } from "@/extension/extension-server-api.ts";
import type { ExtensionPermission, ParsedPermission } from "rua-api";

interface ExtensionViewWrapperProps {
  /** The extension's UI entry path with action query param */
  uiEntry: string;
  /** Extension name for display */
  extensionName: string;
  /** Extension ID */
  extensionId?: string;
  /** Callback when user wants to return */
  onReturn: () => void;
  /** Callback when extension requests input visibility change */
  onInputVisibilityChange?: (visible: boolean) => void;
  /** Current search input value */
  search?: string;
}

/**
 * Wrapper component that connects ExtensionView to ExtensionSystemContext
 * for dev mode hot reload support.
 */
export function ExtensionViewWrapper({
  uiEntry,
  extensionName,
  extensionId,
  onReturn,
  onInputVisibilityChange,
  search,
}: ExtensionViewWrapperProps) {
  const { devRefreshKey, extensions, registerDynamicActions, unregisterDynamicActions } =
    useExtensionSystem();

  // Find the extension to get its permissions and version
  const extension = extensions.find((p) => p.manifest.id === extensionId);
  const extensionVersion = extension?.manifest.version;

  // Parse permissions - extract simple permission strings and detailed configs
  const rawPermissions = extension?.manifest.permissions || [];
  const { simplePermissions, parsedPermissions } = parsePermissions(rawPermissions);

  /**
   * Parse permissions array into simple strings and detailed configs
   */
  function parsePermissions(permissions: ExtensionPermission[]): {
    simplePermissions: string[];
    parsedPermissions: ParsedPermission[];
  } {
    const simplePermissions: string[] = [];
    const parsedPermissions: ParsedPermission[] = [];

    for (const perm of permissions) {
      if (typeof perm === "string") {
        simplePermissions.push(perm);
      } else {
        // Detailed permission config
        simplePermissions.push(perm.permission);

        const parsed: ParsedPermission = {
          permission: perm.permission,
        };

        if (perm.allow) {
          const allowPaths: string[] = [];
          const allowCommands: Array<{ program: string; args?: string[] }> = [];

          for (const rule of perm.allow) {
            if ("path" in rule) {
              allowPaths.push(rule.path);
            } else if ("cmd" in rule) {
              allowCommands.push(rule.cmd);
            }
          }

          if (allowPaths.length > 0) {
            parsed.allowPaths = allowPaths;
          }
          if (allowCommands.length > 0) {
            parsed.allowCommands = allowCommands;
          }
        }

        parsedPermissions.push(parsed);
      }
    }

    return { simplePermissions, parsedPermissions };
  }

  // Handle dynamic action registration
  const handleRegisterActions = (actions: DynamicAction[]) => {
    if (extensionId) {
      registerDynamicActions?.(extensionId, actions);
    }
  };

  const handleUnregisterActions = (actionIds: string[]) => {
    if (extensionId) {
      unregisterDynamicActions?.(extensionId, actionIds);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ExtensionView
        uiEntry={uiEntry}
        extensionName={extensionName}
        extensionId={extensionId}
        extensionVersion={extensionVersion}
        permissions={simplePermissions}
        parsedPermissions={parsedPermissions}
        onReturn={onReturn}
        onInputVisibilityChange={onInputVisibilityChange}
        onRegisterActions={handleRegisterActions}
        onUnregisterActions={handleUnregisterActions}
        refreshKey={devRefreshKey}
        search={search}
      />
    </div>
  );
}
