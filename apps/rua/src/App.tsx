import Home from "./home/Home";
import {ActionUsageProvider} from "@/hooks/useActionUsage";
import {WeatherConfigProvider} from "@/hooks/useWeatherConfig";
import {PluginSystemProvider} from "@/contexts/PluginSystemContext";


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
                </ActionUsageProvider>
            </WeatherConfigProvider>
        </PluginSystemProvider>
    );
}

export default App;
