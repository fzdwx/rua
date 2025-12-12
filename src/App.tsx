import Home from "./home/Home";
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
