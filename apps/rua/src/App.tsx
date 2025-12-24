import Home from "./home/Home";
import { ActionUsageProvider } from "@/hooks/useActionUsage";
import { WeatherConfigProvider } from "@/hooks/useWeatherConfig";
import { ExtensionSystemProvider } from "@/contexts/ExtensionSystemContext.tsx";
import Settings from "@/settings/Settings.tsx";

function AppContent() {
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
