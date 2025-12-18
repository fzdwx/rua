/**
 * hello-word - Initialization Script
 *
 * This script runs when the extension is loaded.
 * It can register dynamic actions and perform initialization.
 */
import { initializeRuaAPI } from "rua-api/browser";

// Initialize when the extension loads
async function init() {
  try {
    // Extension info is automatically fetched from host
    const rua = await initializeRuaAPI();

    console.log(`[${rua.extension.id}] Extension initialized!`);

    // Store last activated time
    await rua.storage.set("lastActivated", new Date().toISOString());

    // Register a dynamic action
    await rua.actions.register([
      {
        id: "dynamic-greeting",
        name: "Dynamic Greeting",
        keywords: ["dynamic", "greeting", "hello"],
        icon: "tabler:sparkles",
        subtitle: "A dynamically registered action",
        mode: "view",
      },
    ]);

    console.log("[hello-word] Dynamic action registered!");
  } catch (err) {
    console.error("[hello-word] Failed to initialize:", err);
  }
}

init();
