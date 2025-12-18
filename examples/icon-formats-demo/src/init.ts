/**
 * Icon Formats Demo - Background Script
 *
 * Demonstrates different icon formats supported by DynamicAction:
 * 1. Iconify icon names
 * 2. Data URIs
 * 3. SVG strings
 * 4. Extension asset paths
 */
import { createMainContextRuaAPI, DynamicAction } from "rua-api/browser";

async function init() {
  const rua = createMainContextRuaAPI();

  console.log(`[${rua.extension.id}] Initializing icon formats demo...`);

  // Register actions on activate
  rua.on("activate", async () => {
    console.log(`[${rua.extension.id}] Registering demo actions...`);

    // Simple SVG for data URI (a star icon)
    const starSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg>`;
    const starDataUri = `data:image/svg+xml;base64,${btoa(starSvg)}`;

    const actions: DynamicAction[] = [
      // 1. Iconify icon name
      {
        id: "iconify-demo",
        name: "Iconify Icon",
        subtitle: "Using tabler:puzzle icon",
        icon: "tabler:puzzle",
        keywords: ["iconify", "demo"],
        mode: "command",
        section: "Icon Demos",
      },

      // 2. Data URI
      {
        id: "datauri-demo",
        name: "Data URI Icon",
        subtitle: "Using base64 encoded SVG",
        icon: starDataUri,
        keywords: ["datauri", "demo"],
        mode: "command",
        section: "Icon Demos",
      },

      // 3. SVG string
      {
        id: "svg-demo",
        name: "SVG String Icon",
        subtitle: "Using inline SVG markup",
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        keywords: ["svg", "demo"],
        mode: "command",
        section: "Icon Demos",
      },

      // 4. Extension asset path (if you have an icon.png in the extension folder)
      {
        id: "asset-demo",
        name: "Asset Path Icon",
        subtitle: "Using ./icon.png from extension folder",
        icon: "./icon.png",
        keywords: ["asset", "demo"],
        mode: "command",
        section: "Icon Demos",
      },

      // More Iconify examples
      {
        id: "iconify-heart",
        name: "Heart Icon",
        subtitle: "mdi:heart",
        icon: "mdi:heart",
        keywords: ["iconify", "heart"],
        mode: "command",
        section: "Icon Demos",
      },
      {
        id: "iconify-rocket",
        name: "Rocket Icon",
        subtitle: "lucide:rocket",
        icon: "lucide:rocket",
        keywords: ["iconify", "rocket"],
        mode: "command",
        section: "Icon Demos",
      },
    ];

    await rua.actions.register(actions);
    console.log(`[${rua.extension.id}] Registered ${actions.length} demo actions`);
  });

  // Handle action triggered
  rua.on("action-triggered", async (data: { actionId: string }) => {
    console.log(`[${rua.extension.id}] Action triggered:`, data.actionId);

    await rua.notification.show({
      title: "Icon Demo",
      body: `You triggered: ${data.actionId}`,
    });
  });
}

init();
