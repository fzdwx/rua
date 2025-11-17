import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    ActionImpl,
    Background,
    Container,
    Input,
    useActionStore,
    useMatches,
} from "@/command";
import {useApplications} from "@/hooks/useApplications";
import {useBuiltInActions} from "@/hooks/useBuiltInActions";
import {useTheme} from "@/hooks/useTheme";
import {Icon} from "@iconify/react";
import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {useActionUsage} from "@/hooks/useActionUsage";
import {translateId, TranslateView} from "@/components/translate";
import {quickLinkCreatorId, quickLinkViewPrefix, QuickLinkCreator, QuickLinkView} from "@/components/quick-link";
import {DefaultView} from "./DefaultView";
import {useQuickLinks} from "@/hooks/useQuickLinks.tsx";

export default function Home() {
    const [search, setSearch] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [resultHandleEvent, setResultHandleEvent] = useState(true);
    const [focusQueryInput, setFocusQueryInput] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const {theme, toggleTheme} = useTheme();
    const {incrementUsage} = useActionUsage();
    const {refreshQuickLinks} = useQuickLinks();

    // Initialize action store
    const {useRegisterActions, setRootActionId, setActiveIndex, state} = useActionStore();

    // Load applications and convert to actions
    const { actions: applicationActions} = useApplications();

    // Get built-in actions (static actions like translate)
    const builtInActions = useBuiltInActions(setRootActionId);

    // Combine all actions (built-in actions first for priority)
    const allActions = useMemo(() => {
        return [...builtInActions, ...applicationActions];
    }, [builtInActions, applicationActions]);

    // Handle window focus - respect disableSearchFocus flag
    useEffect(() => {
        let unlisten: (() => void) | undefined;
        getCurrentWebviewWindow().listen('tauri://focus', () => {
            // Check if current root action has disableSearchFocus flag
            const currentAction = allActions.find(a => a.id === state.rootActionId);
            const shouldFocusSearch = !currentAction?.disableSearchFocus;

            if (shouldFocusSearch) {
                inputRef.current?.focus();
            }
        }).then(unlistenFn => {
            unlisten = unlistenFn;
        });
        return () => {
            unlisten?.();
        };
    }, [state.rootActionId, allActions]);

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

    const currentRootAction = useMemo(() => {
        // let actions = state.actions;
        if (state.rootActionId === null) {
            return null
        }
        let actions  = allActions.filter(v=>{
            return v.id === state.rootActionId;

        })
        return actions[0] as ActionImpl;
    }, [allActions, state.rootActionId]);


    // Handle query submission from Input component
    const handleQuerySubmit = (query: string, actionId: string) => {
        // Track usage when entering action via query submission
        incrementUsage(actionId);
        // Enter the action and set search to the query
        setRootActionId(actionId);
        setSearch(query);
    };

    // Handle action loading state change
    const handleActionLoadingChange = useCallback((loading: boolean) => {
        setActionLoading(loading);
    }, []);

    // Handle query action Enter key press
    const handleQueryActionEnter = useCallback(() => {
        setFocusQueryInput(true);
        // Reset the flag after a short delay to allow re-triggering
        setTimeout(() => {
            setFocusQueryInput(false);
        }, 100);
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
                        // Only focus search box if we're returning to main view (id is null)
                        // or if the target action doesn't have disableSearchFocus
                        if (id === null) {
                            inputRef.current?.focus();
                        } else {
                            const targetAction = allActions.find(a => a.id === id);
                            if (!targetAction?.disableSearchFocus) {
                                inputRef.current?.focus();
                            }
                        }
                    }}
                    actions={state.actions}
                    activeAction={activeMainAction}
                    onQuerySubmit={handleQuerySubmit}
                    setResultHandleEvent={setResultHandleEvent}
                    loading={actionLoading}
                    disableTabFocus={currentRootAction?.disableSearchFocus ?? false}
                    focusQueryInput={focusQueryInput}
                    inputRefSetter={(ref) => {
                        inputRef.current = ref;
                    }}
                    defaultPlaceholder="Type a command or search…"
                />

                {/* Main content area with flex: 1 to prevent footer from being squeezed */}
                <div style={{flex: 1, overflow: "hidden", display: "flex", flexDirection: "column"}}>
                    {/* Show translate view if translate action is active */}
                    {state.rootActionId === translateId ? (
                        <TranslateView search={search} onLoadingChange={handleActionLoadingChange}/>
                    ) : state.rootActionId === quickLinkCreatorId ? (
                        <QuickLinkCreator
                            onLoadingChange={handleActionLoadingChange}
                            onReturn={() => {
                                // Return to main view after creating quick link
                                setRootActionId(null);
                                setSearch("");
                                refreshQuickLinks();
                                // Focus the search input
                                setTimeout(() => {
                                    inputRef.current?.focus();
                                }, 50);
                            }}
                        />
                    ) : state.rootActionId?.startsWith(quickLinkViewPrefix) ? (
                        <QuickLinkView
                            quickLink={currentRootAction?.item}
                            search={search}
                            onLoadingChange={handleActionLoadingChange}
                            onReturn={() => {
                                // Return to main view after opening link
                                setRootActionId(null);
                                setSearch("");
                            }}
                        />
                    ) : (
                        <DefaultView
                            search={search}
                            results={results}
                            activeIndex={state.activeIndex}
                            rootActionId={state.rootActionId}
                            activeMainAction={activeMainAction}
                            resultHandleEvent={resultHandleEvent}
                            inputRef={inputRef}
                            theme={theme}
                            setSearch={setSearch}
                            setActiveIndex={setActiveIndex}
                            setRootActionId={setRootActionId}
                            setResultHandleEvent={setResultHandleEvent}
                            getFooterActions={getFooterActions}
                            getSettingsActions={getSettingsActions}
                            onQueryActionEnter={handleQueryActionEnter}
                        />
                    )}
                </div>
            </Background>
        </Container>
    );
}
