/**
 * Plugin Manager View
 * 
 * Displays installed plugins and allows management operations.
 * Based on Requirements 6.1, 6.2, 6.3
 */

import { Icon } from '@iconify/react';
import { usePluginSystem } from '@/contexts/PluginSystemContext';

interface PluginManagerViewProps {
  onClose: () => void;
}

export function PluginManagerView({ onClose }: PluginManagerViewProps) {
  const { plugins, loading, enablePlugin, disablePlugin, uninstallPlugin } = usePluginSystem();

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
          <h2 className="text-lg font-medium">Plugins</h2>
          <span className="text-sm text-gray-500">({plugins.length})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Icon icon="tabler:x" className="text-lg" />
        </button>
      </div>

      {/* Plugin List */}
      <div className="flex-1 overflow-y-auto">
        {plugins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Icon icon="tabler:puzzle-off" className="text-4xl mb-2" />
            <p>No plugins installed</p>
            <p className="text-sm mt-1">Install plugins to extend functionality</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {plugins.map((plugin) => (
              <div
                key={plugin.manifest.id}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plugin.manifest.name}</span>
                      <span className="text-xs text-gray-500">v{plugin.manifest.version}</span>
                      {plugin.error && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <Icon icon="tabler:alert-circle" />
                          Error
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {plugin.manifest.description || plugin.manifest.id}
                    </p>
                    {plugin.manifest.author && (
                      <p className="text-xs text-gray-400 mt-1">
                        by {plugin.manifest.author}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {plugin.manifest.rua.actions.length} action(s)
                      </span>
                      {plugin.manifest.permissions && plugin.manifest.permissions.length > 0 && (
                        <span className="text-xs text-gray-500">
                          • {plugin.manifest.permissions.length} permission(s)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => plugin.enabled ? disablePlugin(plugin.manifest.id) : enablePlugin(plugin.manifest.id)}
                      className={`px-3 py-1 text-sm rounded ${
                        plugin.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {plugin.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => uninstallPlugin(plugin.manifest.id)}
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
          Plugins extend Rua with custom actions and views.
        </p>
      </div>
    </div>
  );
}
