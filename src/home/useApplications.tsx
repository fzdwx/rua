import {useState, useEffect, useMemo, useCallback} from "react";
import {loadApplications, launchApplication, Application} from "../services/applicationService";
import {Action} from "../command";

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
            applications.map((app) => ({
                id: app.path,
                name: app.name,
                subtitle: app.description,
                keywords: app.description,
                icon: <div style={{fontSize: "20px"}}>{app.icon ? "📱" : "📦"}</div>,
                item: app,
                kind: "application",
                perform: async () => {
                    await handleLaunchApplication(app);
                },
            })),
        [applications, handleLaunchApplication]
    );

    return {
        loading,
        applications,
        actions,
    };
}
