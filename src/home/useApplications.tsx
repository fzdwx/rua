import {useState, useEffect, useMemo, useCallback} from "react";
import {invoke} from "@tauri-apps/api/core";
import {convertFileSrc} from "@tauri-apps/api/core";
import {Action} from "../command";

export interface Application {
    name: string;
    exec: string;
    icon?: string;
    description?: string;
    path: string;
    terminal: boolean;
}

/**
 * Load all applications from the system
 */
async function loadApplications(): Promise<Application[]> {
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
async function launchApplication(app: Application): Promise<void> {
    try {
        await invoke("launch_application", {
            exec: app.exec,
            terminal: app.terminal
        });
        // Hide window after launching
        const {getCurrentWindow} = await import("@tauri-apps/api/window");
        getCurrentWindow().hide();
    } catch (error) {
        console.error("Failed to launch application:", error);
        throw error;
    }
}

/**
 * Custom hook to manage applications
 */
export function useApplications() {
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<Application[]>([]);

    // Load applications on mount
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const apps = await loadApplications();
                setApplications(apps);
            } catch (error) {
                console.error("Failed to load applications:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Launch application callback
    const handleLaunchApplication = useCallback(async (app: Application) => {
        await launchApplication(app);
    }, []);

    // Convert applications to actions
    const actions: Action[] = useMemo(
        () =>
            applications.map((app) => {
                // Convert file:// URL to asset protocol URL
                let iconSrc = null;
                if (app.icon && app.icon.startsWith("file://")) {
                    const filePath = app.icon.replace("file://", "");
                    iconSrc = convertFileSrc(filePath);
                }

                return {
                    id: app.path,
                    name: app.name,
                    subtitle: app.description,
                    keywords: app.description,
                    icon: iconSrc ? (
                        <img
                            src={iconSrc}
                            alt={app.name}
                            style={{
                                width: "24px",
                                height: "24px",
                                objectFit: "contain"
                            }}
                        />
                    ) : (
                        <div style={{fontSize: "20px"}}>📦</div>
                    ),
                    item: app,
                    kind: "application",
                    perform: async () => {
                        await handleLaunchApplication(app);
                    },
                };
            }),
        [applications, handleLaunchApplication]
    );

    return {
        loading,
        applications,
        actions,
    };
}
