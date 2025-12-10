import Home from "./home/Index";
import {register} from '@tauri-apps/plugin-global-shortcut';
import {getCurrentWindow} from "@tauri-apps/api/window";
import {ActionUsageProvider} from "@/hooks/useActionUsage";
import {WeatherConfigProvider} from "@/hooks/useWeatherConfig";
import {useKeyPress} from "ahooks";

register('Alt+Space', async (_e) => {
    let currentWindow = getCurrentWindow();
    let b = await currentWindow.isVisible();
    if (b) {
        await currentWindow.hide()
    } else {
        await currentWindow.center()
        await currentWindow.show()
        await currentWindow.setFocus()
    }
}).catch(e => {
    console.log(e)
});

function AppContent() {
    // 在 wayland 下，如果聚焦了当前窗口，再次使用快捷键是无法触发的
    useKeyPress("alt.space", async (_e) => {
        let currentWindow = getCurrentWindow();
        const b = await currentWindow.isVisible()
        if (b) {
            await currentWindow.hide()
        }
    })

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
