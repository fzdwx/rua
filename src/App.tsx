import Home from "./home/Index";
import {ActionUsageProvider} from "@/hooks/useActionUsage";
import {WeatherConfigProvider} from "@/hooks/useWeatherConfig";


function AppContent() {
    return (
        <>
            <Home/>
        </>
    );
}

function App() {
    return (
        <WeatherConfigProvider>
            <ActionUsageProvider>
                <AppContent/>
            </ActionUsageProvider>
        </WeatherConfigProvider>
    );
}

export default App;
