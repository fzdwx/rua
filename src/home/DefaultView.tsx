import {ActionImpl, Footer, RenderItem, ResultsRender} from "@/command";
import {QuickResult} from "@/components/quick-result";
import {Icon} from "@iconify/react";
import {RefObject} from "react";
import {motion} from "motion/react";

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
    onQueryActionEnter?: () => void; // Called when Enter is pressed on a query action
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
                                onQueryActionEnter,
                            }: DefaultViewProps) {
    return (
        <>
            {/* Quick result view for calculations and built-in functions */}
            <QuickResult search={search}/>

            {
                results.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-10 px-5"
                    >
                        <div className="text-5xl mb-4 opacity-40">🔍</div>
                        <div className="text-gray-11 font-medium mb-2 text-sm">No applications found</div>
                        <div className="text-xs text-gray-10">Try a different search term or check your spelling</div>
                    </motion.div>
                ) : (
                    <ResultsRender
                        items={results}
                        onRender={({item, active}) => {
                            if (typeof item === "string") {
                                return (
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-11 uppercase tracking-wide">
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
                        onQueryActionEnter={onQueryActionEnter}
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
