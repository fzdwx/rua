/**
 * Extension View Wrapper Component
 *
 * Wraps ExtensionView to provide dev mode hot reload support
 * by connecting to the ExtensionSystemContext.
 */

import { useExtensionSystem } from '@/contexts/ExtensionSystemContext.tsx';
import { ExtensionView } from './ExtensionView';
import type { DynamicAction } from '@/lib/extension-server-api';

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
  const { devRefreshKey, extensions, registerDynamicActions, unregisterDynamicActions } = useExtensionSystem();

  // Find the extension to get its permissions and version
  const extension = extensions.find(p => p.manifest.id === extensionId);
  const permissions = extension?.manifest.permissions;
  const extensionVersion = extension?.manifest.version;

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
    <ExtensionView
      uiEntry={uiEntry}
      extensionName={extensionName}
      extensionId={extensionId}
      extensionVersion={extensionVersion}
      permissions={permissions}
      onReturn={onReturn}
      onInputVisibilityChange={onInputVisibilityChange}
      onRegisterActions={handleRegisterActions}
      onUnregisterActions={handleUnregisterActions}
      refreshKey={devRefreshKey}
      search={search}
    />
  );
}
