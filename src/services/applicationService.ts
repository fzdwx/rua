import {invoke} from "@tauri-apps/api/core";

export interface Application {
    name: string;
    exec: string;
    icon?: string;
    description?: string;
    path: string;
}

/**
 * Load all applications from the system
 */
export async function loadApplications(): Promise<Application[]> {
    try {
        const apps = await invoke<Application[]>("get_applications");
        return apps;
    } catch (error) {
        console.error("Failed to load applications:", error);
        throw error;
    }
}

/**
 * Launch an application and hide the window
 */
export async function launchApplication(app: Application): Promise<void> {
    try {
        await invoke("launch_application", {exec: app.exec});
        // Hide window after launching
        const {getCurrentWindow} = await import("@tauri-apps/api/window");
        getCurrentWindow().hide();
    } catch (error) {
        console.error("Failed to launch application:", error);
        throw error;
    }
}
