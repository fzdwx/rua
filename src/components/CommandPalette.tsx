import {useState, useEffect, useRef} from "react";
import {invoke} from "@tauri-apps/api/core";

interface Application {
    name: string;
    exec: string;
    icon?: string;
    description?: string;
    path: string;
}

export default function CommandPalette() {
    const [query, setQuery] = useState("");
    const [applications, setApplications] = useState<Application[]>([]);
    const [filteredApps, setFilteredApps] = useState<Application[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load applications on mount
    useEffect(() => {
        loadApplications();
    }, []);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Filter applications based on query
    useEffect(() => {
        if (!query.trim()) {
            setFilteredApps(applications);
            setSelectedIndex(0);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = applications.filter((app) => {
            const nameLower = app.name.toLowerCase();
            const descLower = app.description?.toLowerCase() || "";

            // Simple fuzzy matching: check if all characters appear in order
            return nameLower.includes(lowerQuery) || descLower.includes(lowerQuery);
        });

        setFilteredApps(filtered);
        setSelectedIndex(0);
    }, [query, applications]);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const apps = await invoke<Application[]>("get_applications");
            setApplications(apps);
            setFilteredApps(apps);
        } catch (error) {
            console.error("Failed to load applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const launchApplication = async (app: Application) => {
        try {
            await invoke("launch_application", {exec: app.exec});
            // Hide window after launching
            const {getCurrentWindow} = await import("@tauri-apps/api/window");
            getCurrentWindow().hide();
        } catch (error) {
            console.error("Failed to launch application:", error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredApps.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case "Enter":
                e.preventDefault();
                if (filteredApps[selectedIndex]) {
                    launchApplication(filteredApps[selectedIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                setQuery("");
                break;
        }
    };

    return (
        <div className="command-container">
            {/* Fixed Input at Top */}
            <input
                ref={inputRef}
                type="text"
                className="command-input"
                autoComplete="off"
                autoFocus
                spellCheck="false"
                placeholder="Type a command or search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
            />

            {/* Scrollable Results */}
            <div className="command-background">
                <div
                    className="command-listbox"
                    style={{
                        height: "100%",
                        overflowY: "auto",
                        paddingTop: "60px",
                    }}
                >
                    {loading ? (
                        <div style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            color: "var(--gray11)",
                            fontSize: "14px"
                        }}>
                            Loading applications...
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            color: "var(--gray11)",
                            fontSize: "14px"
                        }}>
                            No applications found
                        </div>
                    ) : (
                        filteredApps.slice(0, 10).map((app, index) => (
                            <div
                                key={app.path}
                                className={index === selectedIndex ? "command-item-active" : "command-item"}
                                onClick={() => launchApplication(app)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "12px",
                                        alignItems: "center",
                                        fontSize: "14px",
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{fontSize: "20px"}}>
                                        {app.icon ? "📱" : "📦"}
                                    </div>

                                    {/* Name and description */}
                                    <div style={{display: "flex", flexDirection: "column"}}>
                                        <div>{app.name}</div>
                                        {app.description && (
                                            <span style={{fontSize: "12px", color: "var(--gray11)"}}>
                        {app.description}
                      </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
