import {useCallback, useEffect, useMemo, useState} from "react";
import {convertFileSrc, invoke} from "@tauri-apps/api/core";
import {Action} from "@/command";
import {useActionUsage} from "@/hooks/useActionUsage";

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
    const {getUsageCount, incrementUsage} = useActionUsage();

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
    const handleLaunchApplication = useCallback(async (app: Application, actionId: string) => {
        incrementUsage(actionId);
        await launchApplication(app);
    }, [incrementUsage]);

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

                const actionId = app.path;
                const usageCount = getUsageCount(actionId);

                return {
                    id: actionId,
                    name: app.name,
                    subtitle: app.description,
                    keywords: app.description,
                    icon: iconSrc ? (
                        <img
                            src={iconSrc}
                            alt={app.name}
                            className="size-6 object-contain"
                        />
                    ) : (
                        <div className="text-xl">📦</div>
                    ),
                    item: app,
                    kind: "application",
                    usageCount,
                    badge: "Application",
                    perform: async () => {
                        await handleLaunchApplication(app, actionId);
                    },
                };
            }),
        [applications, handleLaunchApplication, getUsageCount]
    );

    return {
        loading,
        applications,
        actions,
    };
}
