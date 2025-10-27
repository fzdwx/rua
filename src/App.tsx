import Home from "./home/Index";
import {register} from '@tauri-apps/plugin-global-shortcut';
import {getCurrentWindow} from "@tauri-apps/api/window";

register('Alt+Space', async (e) => {
    if (e.state == 'Released') {
        let currentWindow = getCurrentWindow();
        let b = await currentWindow.isVisible();
        console.log(b)
        if (b) {
            await currentWindow.hide()
        } else {
            await currentWindow.show()
        }
    }
}).catch(e => {
    console.log(e)
});

function App() {
    return <Home />;
}

export default App;
