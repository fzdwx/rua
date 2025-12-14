/**
 * Extension Manager View
 *
 * Displays installed extensions and allows management operations.
 * Based on Requirements 6.1, 6.2, 6.3
 */

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useExtensionSystem } from '@/contexts/ExtensionSystemContext.tsx';

interface ExtensionManagerViewProps {
  onClose: () => void;
}

export function ExtensionManagerView({ onClose }: ExtensionManagerViewProps) {
  const {
    extensions,
    loading,
    enableExtension,
    disableExtension,
    uninstallExtension,
    installExtension,
    reloadExtensions,
    devExtensionPath,
    setDevExtensionPath,
  } = useExtensionSystem();

  const [installPath, setInstallPath] = useState('');
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devPath, setDevPath] = useState(devExtensionPath || '');
  const [reloading, setReloading] = useState(false);

  const handleReload = async () => {
    setReloading(true);
    try {
      await reloadExtensions();
    } finally {
      setReloading(false);
    }
  };

  const handleSetDevPath = () => {
    if (devExtensionPath) {
      // Stop dev mode
      setDevExtensionPath(null);
      setDevPath('');
    } else {
      // Start dev mode
      setDevExtensionPath(devPath.trim() || null);
    }
  };

  const handleInstall = async () => {
    if (!installPath.trim()) return;

    setInstalling(true);
    setError(null);

    try {
      await installExtension(installPath.trim());
      setInstallPath('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setInstalling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="tabler:loader-2" className="animate-spin text-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Icon icon="tabler:puzzle" className="text-xl" />
          <h2 className="text-lg font-medium">Extensions</h2>
          <span className="text-sm text-gray-500">({extensions.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            disabled={reloading}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            title="Reload extensions"
          >
            <Icon icon="tabler:refresh" className={`text-lg ${reloading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Icon icon="tabler:x" className="text-lg" />
          </button>
        </div>
      </div>

      {/* Dev Mode Section */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
        <div className="flex items-center gap-2 mb-2">
          <Icon icon="tabler:code" className="text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Development Mode</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={devPath}
            onChange={(e) => setDevPath(e.target.value)}
            placeholder="Dev extension path (e.g., /home/user/my-extension)"
            className="flex-1 px-3 py-1.5 text-sm border rounded bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-600 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleSetDevPath}
            className={`px-3 py-1.5 text-sm rounded flex items-center gap-1 ${
              devExtensionPath 
                ? 'bg-amber-500 text-white hover:bg-amber-600' 
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-800 dark:text-amber-200'
            }`}
          >
            <Icon icon={devExtensionPath ? 'tabler:player-stop' : 'tabler:player-play'} />
            {devExtensionPath ? 'Stop' : 'Start'}
          </button>
        </div>
        {devExtensionPath && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            <Icon icon="tabler:info-circle" className="inline mr-1" />
            Dev extension loaded. Click refresh to reload after changes.
          </p>
        )}
      </div>

      {/* Install Section */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={installPath}
            onChange={(e) => setInstallPath(e.target.value)}
            placeholder="github:owner/repo or /path/to/extension"
            className="flex-1 px-3 py-1.5 text-sm border rounded bg-transparent border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleInstall}
            disabled={installing || !installPath.trim()}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {installing ? (
              <Icon icon="tabler:loader-2" className="animate-spin" />
            ) : (
              <Icon icon="tabler:plus" />
            )}
            Install
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          GitHub: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">github:owner/repo</code> or local path: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/path/to/extension</code>
        </p>
      </div>

      {/* Extension List */}
      <div className="flex-1 overflow-y-auto">
        {extensions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Icon icon="tabler:puzzle-off" className="text-4xl mb-2" />
            <p>No extensions installed</p>
            <p className="text-sm mt-1">Install extensions to extend functionality</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {extensions.map((extension) => (
              <div
                key={extension.manifest.id}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{extension.manifest.name}</span>
                      <span className="text-xs text-gray-500">v{extension.manifest.version}</span>
                      {extension.error && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <Icon icon="tabler:alert-circle" />
                          Error
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {extension.manifest.description || extension.manifest.id}
                    </p>
                    {extension.manifest.author && (
                      <p className="text-xs text-gray-400 mt-1">
                        by {extension.manifest.author}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {extension.manifest.rua.actions.length} action(s)
                      </span>
                      {extension.manifest.permissions && extension.manifest.permissions.length > 0 && (
                        <span className="text-xs text-gray-500">
                          • {extension.manifest.permissions.length} permission(s)
                        </span>
                      )}
                    </div>
                    {extension.error && (
                      <p className="text-xs text-red-400 mt-1">{extension.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => extension.enabled ? disableExtension(extension.manifest.id) : enableExtension(extension.manifest.id)}
                      className={`px-3 py-1 text-sm rounded ${
                        extension.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {extension.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => uninstallExtension(extension.manifest.id, extension.path)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Uninstall"
                    >
                      <Icon icon="tabler:trash" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500">
          Extensions extend Rua with custom actions and views.
          Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">bunx create-rua-ext</code> to create a new extension.
        </p>
      </div>
    </div>
  );
}
