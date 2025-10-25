import {useState, useRef, useMemo} from "react";
import {
    Container,
    Background,
    Input,
    ResultsRender,
    RenderItem,
    useActionStore,
    useMatches,

    ActionImpl,
} from "../command";
import {useApplications} from "./useApplications";
import {QuickResult} from "./QuickResult";
import {useBuiltInActions} from "./useBuiltInActions";
import {TranslateView} from "./TranslateView";

export default function Home() {
    const [search, setSearch] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Load applications and convert to actions
    const {loading, actions: applicationActions} = useApplications();

    // Get built-in actions (static actions like translate)
    const builtInActions = useBuiltInActions();

    // Combine all actions (built-in actions first for priority)
    const allActions = useMemo(() => {
        return [...builtInActions, ...applicationActions];
    }, [builtInActions, applicationActions]);

    // Initialize action store
    const {useRegisterActions, setRootActionId, setActiveIndex, setResultHandleEvent, state} = useActionStore();

    // Register actions when they change
    useRegisterActions(allActions, [allActions]);

    // Use the matches hook for search and filtering
    const {results} = useMatches(search, state.actions, state.rootActionId);

    // Get the currently active action
    const activeAction = useMemo(() => {
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

    return (
        <Container>
            <Background>
                <Input
                    value={search}
                    onValueChange={setSearch}
                    currentRootActionId={state.rootActionId}
                    onCurrentRootActionIdChange={setRootActionId}
                    actions={state.actions}
                    activeAction={activeAction}
                    onQuerySubmit={handleQuerySubmit}
                    setResultHandleEvent={setResultHandleEvent}
                    inputRefSetter={(ref) => {
                        inputRef.current = ref;
                    }}
                    defaultPlaceholder="Type a command or search…"
                />

                {/* Show translate view if translate action is active */}
                {state.rootActionId === "built-in-translate" ? (
                    <TranslateView search={search} />
                ) : (
                    <>
                        {/* Quick result view for calculations and built-in functions */}
                        <QuickResult search={search} />

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
                                handleKeyEvent={state.resultHandleEvent}
                            />
                        )}
                    </>
                )}
            </Background>
        </Container>
    );
}
