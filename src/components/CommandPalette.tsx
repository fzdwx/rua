import {useState, useEffect, useRef, useMemo, useCallback} from "react";
import {invoke} from "@tauri-apps/api/core";
import {
    Container,
    Background,
    Input,
    ResultsRender,
    RenderItem,
    useActionStore,
    useMatches,
    Action,
    ActionImpl,
} from "../command";

interface Application {
    name: string;
    exec: string;
    icon?: string;
    description?: string;
    path: string;
}

export default function CommandPalette() {
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<Application[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize action store
    const {useRegisterActions, setRootActionId, setActiveIndex, state} = useActionStore();

    // Load applications on mount
    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const apps = await invoke<Application[]>("get_applications");
            setApplications(apps);
        } catch (error) {
            console.error("Failed to load applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const launchApplication = useCallback(async (app: Application) => {
        try {
            await invoke("launch_application", {exec: app.exec});
            // Hide window after launching
            const {getCurrentWindow} = await import("@tauri-apps/api/window");
            getCurrentWindow().hide();
        } catch (error) {
            console.error("Failed to launch application:", error);
        }
    }, []);

    // Convert applications to actions and register them
    const actions: Action[] = useMemo(() =>
        applications.map((app) => ({
            id: app.path,
            name: app.name,
            subtitle: app.description,
            keywords: app.description,
            icon: <div style={{fontSize: "20px"}}>{app.icon ? "📱" : "📦"}</div>,
            item: app,
            kind: "application",
            perform: async () => {
                await launchApplication(app);
            },
        })),
        [applications, launchApplication]
    );

    // Register actions when applications change
    useRegisterActions(actions, [applications]);

    // Use the matches hook for search and filtering
    const {results} = useMatches(search, state.actions, state.rootActionId);

    return (
        <Container>
            <Input
                value={search}
                onValueChange={setSearch}
                currentRootActionId={state.rootActionId}
                onCurrentRootActionIdChange={setRootActionId}
                actions={state.actions}
                inputRefSetter={(ref) => {
                    inputRef.current = ref;
                }}
                defaultPlaceholder="Type a command or search…"
            />

            <Background>
                {loading ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            color: "var(--gray11)",
                            fontSize: "14px",
                        }}
                    >
                        Loading applications...
                    </div>
                ) : results.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            color: "var(--gray11)",
                            fontSize: "14px",
                        }}
                    >
                        No applications found
                    </div>
                ) : (
                    <ResultsRender
                        items={results}
                        onRender={({item, active}) => {
                            if (typeof item === "string") {
                                return <div style={{padding: "8px 16px", fontSize: "12px", color: "var(--gray11)", fontWeight: "bold"}}>{item}</div>;
                            }
                            return (
                                <RenderItem
                                    action={item as ActionImpl}
                                    active={active}
                                    currentRootActionId={state.rootActionId || ""}
                                />
                            );
                        }}
                        height="auto"
                        search={search}
                        setSearch={setSearch}
                        activeIndex={state.activeIndex}
                        setActiveIndex={setActiveIndex}
                        setRootActionId={setRootActionId}
                        currentRootActionId={state.rootActionId}
                        handleKeyEvent={state.resultHandleEvent}
                    />
                )}
            </Background>
        </Container>
    );
}
