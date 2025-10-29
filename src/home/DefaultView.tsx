import {ActionImpl, Footer, RenderItem, ResultsRender} from "@/command";
import {QuickResult} from "@/components/quick-result";
import {Icon} from "@iconify/react";
import {RefObject} from "react";

interface DefaultViewProps {
    search: string;
    results: (string | ActionImpl)[];
    activeIndex: number;
    rootActionId: string | null;
    activeMainAction: ActionImpl | null;
    resultHandleEvent: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    theme: string;
    setSearch: (search: string) => void;
    setActiveIndex: (index: number | ((prev: number) => number)) => void;
    setRootActionId: (id: string | null) => void;
    setResultHandleEvent: (value: boolean) => void;
    getFooterActions: (current: string | ActionImpl | null, changeVisible: () => void) => any[];
    getSettingsActions: () => any[];
}

/**
 * DefaultView component - displays the main search interface with results and footer
 */
export function DefaultView({
                                search,
                                results,
                                activeIndex,
                                rootActionId,
                                activeMainAction,
                                resultHandleEvent,
                                inputRef,
                                setSearch,
                                setActiveIndex,
                                setRootActionId,
                                setResultHandleEvent,
                                getFooterActions,
                                getSettingsActions,
                            }: DefaultViewProps) {
    return (
        <>
            {/* Quick result view for calculations and built-in functions */}
            <QuickResult search={search}/>

            {
                results.length === 0 ? (
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
                                    currentRootActionId={rootActionId || ""}
                                />
                            );
                        }}
                        height="auto"
                        search={search}
                        setSearch={setSearch}
                        activeIndex={activeIndex}
                        setActiveIndex={setActiveIndex}
                        setRootActionId={setRootActionId}
                        currentRootActionId={rootActionId}
                        handleKeyEvent={resultHandleEvent}
                    />
                )}

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
        </>
    );
}
