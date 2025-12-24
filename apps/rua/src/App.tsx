import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Home from "./home/Home";
import { ActionUsageProvider } from "@/hooks/useActionUsage";
import { WeatherConfigProvider } from "@/hooks/useWeatherConfig";
import { ExtensionSystemProvider } from "@/contexts/ExtensionSystemContext.tsx";
import Settings from "@/settings/Settings.tsx";
import { useTheme } from "@/hooks/useTheme";
import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";

function AppContent() {
  const { setTheme } = useTheme();

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const themeValue = await invoke<string | null>("get_preference", {
          namespace: "system",
          key: "theme",
        });

        if (themeValue) {
          const theme = JSON.parse(themeValue) as "light" | "dark" | "system";
          setTheme(theme);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      }
    };

    loadTheme();
  }, [setTheme]);

  // 监听跨窗口主题变化事件
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    getCurrentWebviewWindow()
      .listen<{ key: string; value: unknown }>("rua://system-config-changed", (event) => {
        // Handle different system config changes
        if (event.payload.key === "theme") {
          const theme = event.payload.value as "light" | "dark" | "system";
          setTheme(theme);
        }
        // Add more handlers here as needed
      })
      .then((unlistenFn) => {
        unlisten = unlistenFn;
      });

    return () => {
      unlisten?.();
    };
  }, [setTheme]);

  console.log(window.location.search);
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get("type");

  if (!type) {
    return (
      <>
        <Home />
      </>
    );
  }

  return (
    <>
      <Settings />
    </>
  );
}

function App() {
  return (
    <ExtensionSystemProvider>
      <WeatherConfigProvider>
        <ActionUsageProvider>
          <AppContent />
        </ActionUsageProvider>
      </WeatherConfigProvider>
    </ExtensionSystemProvider>
  );
}

export default App;
