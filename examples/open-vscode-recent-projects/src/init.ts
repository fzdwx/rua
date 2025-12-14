/**
 * open-vscode-recent-projects - Background Script
 *
 * This script runs automatically when the rua application starts.
 * It executes in the main program context (not in an iframe).
 *
 * Background scripts can:
 * - Register dynamic actions that appear in the command palette
 * - Respond to lifecycle events (activate/deactivate)
 * - Persist data using extension storage
 *
 * Lifecycle events:
 * - 'activate': Called when main window is shown
 * - 'deactivate': Called when main window is hidden
 */
import {createMainContextRuaAPI} from 'rua-api/browser'

// Initialize when the background script loads
async function init() {
    try {
        // Get the Rua API for background scripts
        // The API is injected by the background executor before this script runs
        const rua = createMainContextRuaAPI()
        const openWithCode = (path: string) => {
            rua.shell.execute("code", [path])
        }
        let vscodeFile = await rua.fs.readTextFile("~/.config/Code/User/globalStorage/storage.json");

        console.log("vsaaaa:===============",vscodeFile)

        console.log(`[${rua.extension.id}] Background script initialized!`)

        // Store last activated time
        await rua.storage.set('lastActivated', new Date().toISOString())

        // Listen for main window activation (shown)
        rua.on('activate', async () => {
            console.log('[open-vscode-recent-projects] Main window activated!')

            // Register dynamic actions when window is shown
            await rua.actions.register([
                {
                    id: 'dynamic-action',
                    name: 'Dynamic Action',
                    keywords: ['dynamic', 'open-vscode-recent-projects'],
                    icon: 'tabler:sparkles',
                    subtitle: 'A dynamically registered action',
                    mode: 'view'
                }
            ])
        })

        // Listen for main window deactivation (hidden)
        rua.on('deactivate', async () => {
            console.log('[open-vscode-recent-projects] Main window deactivated!')

            // Optionally unregister actions when window is hidden
            // await rua.actions.unregister(['dynamic-action'])
        })

        console.log('[open-vscode-recent-projects] Lifecycle handlers registered!')
    } catch (err) {
        console.error('[open-vscode-recent-projects] Failed to initialize:', err)
    }
}

init()
