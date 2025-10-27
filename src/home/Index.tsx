import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    ActionImpl,
    Background,
    Container,
    Footer,
    Input,
    RenderItem,
    ResultsRender,
    useActionStore,
    useMatches,
} from "@/command";
import {useApplications} from "./useApplications";
import {QuickResult} from "./QuickResult";
import {useBuiltInActions} from "./useBuiltInActions";
import {TranslateView} from "./TranslateView";
import {useTheme} from "./useTheme";
import {Icon} from "@iconify/react";
import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";

export default function Home() {
    const [search, setSearch] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [resultHandleEvent, setResultHandleEvent] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const {theme, toggleTheme} = useTheme();

    useEffect(() => {
        let unlisten: (() => void) | undefined;
        getCurrentWebviewWindow().listen('tauri://focus', () => {
            inputRef.current?.focus();
        }).then(unlistenFn => {
            unlisten = unlistenFn;
        });
        return () => {
            unlisten?.();
        };
    }, []);

    // Load applications and convert to actions
    const {loading, actions: applicationActions} = useApplications();

    // Get built-in actions (static actions like translate)
    const builtInActions = useBuiltInActions();

    // Combine all actions (built-in actions first for priority)
    const allActions = useMemo(() => {
        return [...builtInActions, ...applicationActions];
    }, [builtInActions, applicationActions]);

    // Initialize action store
    const {useRegisterActions, setRootActionId, setActiveIndex, state} = useActionStore();

    // Register actions when they change
    useRegisterActions(allActions, [allActions]);

    // Use the matches hook for search and filtering
    const {results} = useMatches(search, state.actions, state.rootActionId);

    // Get the currently active main action
    const activeMainAction = useMemo(() => {
        if (results.length === 0 || state.activeIndex < 0) {
            return null;
        }
        const activeItem = results[state.activeIndex];
        if (typeof activeItem === "string") {
            return null;
        }
        return activeItem as ActionImpl;
    }, [results, state.activeIndex]);

    // Handle query submission from Input component
    const handleQuerySubmit = (query: string, actionId: string) => {
        // Enter the action and set search to the query
        setRootActionId(actionId);
        setSearch(query);
    };

    // Handle action loading state change
    const handleActionLoadingChange = useCallback((loading: boolean) => {
        setActionLoading(loading);
    }, []);

    // Generate footer actions based on active main action
    const getFooterActions = useCallback((current: string | ActionImpl | null, changeVisible: () => void) => {
        const footerActions = [];

        // Add action-specific footer actions if available
        // Only process if current is an ActionImpl (not string)
        if (current && typeof current !== "string" && current.footerAction) {
            const actionSpecificFooterActions = current.footerAction(changeVisible);
            footerActions.push(...actionSpecificFooterActions);
        }

        return footerActions;
    }, []);

    // Generate settings actions
    const getSettingsActions = useCallback(() => {
        return [
            {
                id: "toggle-theme",
                name: "Toggle Theme",
                subtitle: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
                icon: <Icon icon={theme === "dark" ? "tabler:sun" : "tabler:moon"} style={{fontSize: "20px"}}/>,
                keywords: "theme dark light mode",
                perform: () => {
                    toggleTheme();
                },
            },
        ];
    }, [theme, toggleTheme]);

    return (
        <Container>
            <Background>
                <Input
                    value={search}
                    onValueChange={setSearch}
                    currentRootActionId={state.rootActionId}
                    onCurrentRootActionIdChange={(id) => {
                        setRootActionId(id)
                        inputRef.current?.focus();
                    }}
                    actions={state.actions}
                    activeAction={activeMainAction}
                    onQuerySubmit={handleQuerySubmit}
                    setResultHandleEvent={setResultHandleEvent}
                    loading={actionLoading}
                    inputRefSetter={(ref) => {
                        inputRef.current = ref;
                    }}
                    defaultPlaceholder="Type a command or search…"
                />

                {/* Main content area with flex: 1 to prevent footer from being squeezed */}
                <div style={{flex: 1, overflow: "hidden", display: "flex", flexDirection: "column"}}>
                    {/* Show translate view if translate action is active */}
                    {state.rootActionId === "built-in-translate" ? (
                        <TranslateView search={search} onLoadingChange={handleActionLoadingChange}/>
                    ) : (
                        <>
                            {/* Quick result view for calculations and built-in functions */}
                            <QuickResult search={search}/>

                            {loading ? (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        padding: "40px 20px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "40px",
                                            height: "4px",
                                            background: "var(--gray6)",
                                            borderRadius: "2px",
                                            overflow: "hidden",
                                            position: "relative",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "50%",
                                                height: "100%",
                                                background: "var(--primary)",
                                                borderRadius: "2px",
                                                animation: "loading 1.5s ease-in-out infinite",
                                            }}
                                        />
                                    </div>
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
                                            return (
                                                <div
                                                    style={{
                                                        padding: "8px 16px",
                                                        fontSize: "12px",
                                                        color: "var(--gray11)",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {item}
                                                </div>
                                            );
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
                                    handleKeyEvent={resultHandleEvent}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Footer with theme toggle and dynamic actions */}
                <Footer
                    current={activeMainAction}
                    icon={<Icon icon="tabler:command" style={{fontSize: "20px"}}/>}
                    content={() => (
                        <div/>
                    )}
                    actions={getFooterActions}
                    settings={getSettingsActions()}
                    mainInputRef={inputRef}
                    onSubCommandHide={() => {
                        setResultHandleEvent(true)
                        inputRef.current?.focus()
                    }}
                    onSubCommandShow={() => {
                        setResultHandleEvent(false)
                    }}
                />
            </Background>
        </Container>
    );
}
