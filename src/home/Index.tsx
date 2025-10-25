import {useState, useRef} from "react";
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

export default function Home() {
    const [search, setSearch] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Load applications and convert to actions
    const {loading, actions} = useApplications();

    // Initialize action store
    const {useRegisterActions, setRootActionId, setActiveIndex, state} = useActionStore();

    // Register actions when applications change
    useRegisterActions(actions, [actions]);

    // Use the matches hook for search and filtering
    const {results} = useMatches(search, state.actions, state.rootActionId);

    return (
        <Container>
            <Background>
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
            </Background>
        </Container>
    );
}
