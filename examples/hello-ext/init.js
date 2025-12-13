/**
 * Hello Extension - Initialization Script
 * 
 * This script runs when the extension is loaded.
 * It can be used for background tasks, registering shortcuts, etc.
 */

// Extension activation function
export function activate(api) {
  console.log(`[${api.pluginId}] Extension activated!`);
  
  // Example: Store some data
  api.storage.set('lastActivated', new Date().toISOString())
    .then(() => console.log('Stored activation time'))
    .catch(err => console.error('Failed to store:', err));
}

// Extension deactivation function (optional)
export function deactivate() {
  console.log('[example.hello-ext] Extension deactivated!');
}
