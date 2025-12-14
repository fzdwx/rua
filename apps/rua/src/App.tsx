import Home from "./home/Home";
import {ActionUsageProvider} from "@/hooks/useActionUsage";
import {WeatherConfigProvider} from "@/hooks/useWeatherConfig";
import {PluginSystemProvider} from "@/contexts/ExtensionSystemContext.tsx";
import {Toaster} from "@/components/ui/sonner";


function AppContent() {
    return (
        <>
            <Home/>
        </>
    );
}

function App() {
    return (
        <PluginSystemProvider>
            <WeatherConfigProvider>
                <ActionUsageProvider>
                    <AppContent/>
                    <Toaster />
                </ActionUsageProvider>
            </WeatherConfigProvider>
        </PluginSystemProvider>
    );
}

export default App;
