import Home from "./home/Index";
import {register} from '@tauri-apps/plugin-global-shortcut';
import {getCurrentWindow} from "@tauri-apps/api/window";
import {ActionUsageProvider} from "@/hooks/useActionUsage";

register('Alt+Space', async (e) => {
    if (e.state == 'Released') {
        let currentWindow = getCurrentWindow();
        let b = await currentWindow.isVisible();
        if (b) {
            await currentWindow.hide()
        } else {
            await currentWindow.center()
            await currentWindow.show()
            await currentWindow.setFocus()
        }
    }
}).catch(e => {
    console.log(e)
});

function AppContent() {
    return (
        <>
            <Home/>
        </>
    );
}

function App() {
    return (
        <ActionUsageProvider>
            <AppContent/>
        </ActionUsageProvider>
    );
}

export default App;
