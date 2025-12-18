import Home from "./home/Home";
import { ActionUsageProvider } from "@/hooks/useActionUsage";
import { WeatherConfigProvider } from "@/hooks/useWeatherConfig";
import { ExtensionSystemProvider } from "@/contexts/ExtensionSystemContext.tsx";
import { Toaster } from "@/components/ui/sonner";

function AppContent() {
  return (
    <>
      <Home />
    </>
  );
}

function App() {
  return (
    <ExtensionSystemProvider>
      <WeatherConfigProvider>
        <ActionUsageProvider>
          <AppContent />
          <Toaster />
        </ActionUsageProvider>
      </WeatherConfigProvider>
    </ExtensionSystemProvider>
  );
}

export default App;
