import {Action, ActionImpl, Input, RenderItem, ResultsRender, useActionStore, useMatches} from ".";
import * as React from "react";
import {useEffect, useState} from "react";
import {useKeyPress} from "ahooks";
import * as Popover from "@radix-ui/react-popover";

export const Footer: React.FC<{
    current: string | ActionImpl | null,
    icon: string | React.ReactElement
    actions: (current: string | ActionImpl | null, changeVisible: () => void) => Action[]
    content: (current?: string | ActionImpl | null) => string | React.ReactElement
    onSubCommandHide?: () => void
    onSubCommandShow?: () => void
    mainInputRef?: React.RefObject<HTMLInputElement | null>
    settings?: Action[]  // Settings actions for settings menu
}> = ({
          current,
          actions,
          icon,
          content,
          onSubCommandShow,
          onSubCommandHide,
          mainInputRef,
          settings
      }) => {
    return <div className='command-footer'>
        <div className='command-footer-icon'>
            {icon}
        </div>
        <div className=''>
            {content(current)}
        </div>

        <FooterActionRender
            onSubCommandHide={onSubCommandHide}
            onSubCommandShow={onSubCommandShow}
            actions={actions}
            current={current}
            mainInputRef={mainInputRef}
        />

        {settings && settings.length > 0 && (
            <>
                <FooterHr/>
                <FooterSettings
                    onSubCommandHide={onSubCommandHide}
                    onSubCommandShow={onSubCommandShow}
                    settings={settings}
                    mainInputRef={mainInputRef}
                />
            </>
        )}
    </div>
}

const FooterActionRender: React.FC<{
    actions: (current: string | ActionImpl | null, changeVisible: () => void) => Action[]
    current: string | ActionImpl | null,
    onSubCommandHide?: () => void
    onSubCommandShow?: () => void
    mainInputRef?: React.RefObject<HTMLInputElement | null>
}> = ({
          actions,
          onSubCommandHide,
          onSubCommandShow,
          current,
          mainInputRef
      }) => {
    if (actions.length === 0) {
        return <></>
    }

    return <>
        <FooterHr/>
        <FooterActions
            current={current}
            onSubCommandShow={() => {
                if (onSubCommandShow) {
                    onSubCommandShow()
                }
            }}
            onSubCommandHide={() => {
                if (onSubCommandHide) {
                    onSubCommandHide()
                }
            }}
            actions={actions}
            mainInputRef={mainInputRef}
        />
    </>
}

export const FooterHr: React.FC = () => {
    return (
        <hr className='command-footer-hr'/>
    );
}

const FooterActions: React.FC<{
    actions: (current: string | ActionImpl | null, changeVisible: () => void) => Action[]
    current: string | ActionImpl | null,
    initialOpen?: boolean,
    initialShortcut?: string // default 'ctrl.k'
    onSubCommandShow: () => void
    onSubCommandHide: () => void
    mainInputRef?: React.RefObject<HTMLInputElement | null>
}> = ({
          actions,
          initialOpen,
          initialShortcut,
          onSubCommandShow,
          onSubCommandHide,
          current,
          mainInputRef
      }) => {
    const [open, setOpen] = React.useState(initialOpen || false)
    const [shortcut] = React.useState(initialShortcut || 'ctrl.k')
    const footerInputRef = React.useRef<HTMLInputElement>(null)

    const changeVisible = () => setOpen((o) => !o)

    useKeyPress(shortcut, (e) => {
        e.preventDefault()
        changeVisible()
    })

    React.useEffect(() => {
        if (open) {
            onSubCommandShow()
            // Focus footer input when opened
            setTimeout(() => {
                footerInputRef.current?.focus()
            }, 0)
        } else {
            // // Focus main input when closed
            // setTimeout(() => {
            //     mainInputRef?.current?.focus()
            // }, 0)
        }
    }, [open, onSubCommandShow, mainInputRef])

    const [currentActions, setCurrentActions] = useState<Action[]>([])

    useEffect(() => {
        const res = actions ? actions(current, changeVisible) : []
        setCurrentActions(res)
    }, [current, actions])

    const [inputValue, setInputValue] = React.useState("");
    const {useRegisterActions, state, setActiveIndex, setRootActionId} = useActionStore();
    useRegisterActions(currentActions, [currentActions])

    const {results, rootActionId} = useMatches(inputValue, state.actions, state.rootActionId);

    return <Popover.Root open={open} onOpenChange={setOpen} modal>
        <Popover.Trigger className='command-subcommand-trigger' onClick={changeVisible} aria-expanded={open}>
            <span>Actions</span>
            {shortcut.split('.').map((s, i) => <kbd key={i}>{s}</kbd>)}
        </Popover.Trigger>
        <Popover.Content
            side="top"
            align="end"
            sideOffset={16}
            alignOffset={0}
            onCloseAutoFocus={(e) => {
                e.preventDefault()
                onSubCommandHide()
                setInputValue("")
            }}
        >
            <div className='command-submenu'>
                <ResultsRender items={results}
                               maxHeight={150}
                               height='auto'
                               handleKeyEvent={true}
                               setActiveIndex={setActiveIndex}
                               search={inputValue}
                               setSearch={setInputValue}
                               setRootActionId={setRootActionId}
                               currentRootActionId={state.rootActionId}
                               activeIndex={state.activeIndex}
                               onRender={({item, active}) => {
                                   if (typeof item === "string") {
                                       return <div>{item}</div>
                                   }

                                   return <RenderItem
                                       active={active}

                                       action={item}
                                       currentRootActionId={rootActionId ?? ''}
                                   />
                               }
                               }
                />
                <Input value={inputValue}
                       onValueChange={setInputValue}
                       actions={state.actions}
                       currentRootActionId={state.rootActionId}
                       onCurrentRootActionIdChange={setRootActionId}
                       inputRefSetter={(ref) => {
                           footerInputRef.current = ref
                       }}
                />
            </div>
        </Popover.Content>
    </Popover.Root>
}

const FooterSettings: React.FC<{
    settings: Action[]
    onSubCommandHide?: () => void
    onSubCommandShow?: () => void
    mainInputRef?: React.RefObject<HTMLInputElement | null>
}> = ({
          settings,
          onSubCommandHide,
          onSubCommandShow,
      }) => {
    const [open, setOpen] = React.useState(false)

    const changeVisible = () => setOpen((o) => !o)

    React.useEffect(() => {
        if (open) {
            onSubCommandShow?.()
        }
    }, [open, onSubCommandShow])

    const {useRegisterActions, state, setActiveIndex, setRootActionId} = useActionStore();
    useRegisterActions(settings, [settings])

    const {results} = useMatches("", state.actions, state.rootActionId);

    return <Popover.Root open={open} onOpenChange={setOpen} modal>
        <Popover.Trigger className='command-subcommand-trigger' onClick={changeVisible} aria-expanded={open}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </div>
        </Popover.Trigger>
        <Popover.Content
            side="top"
            align="end"
            sideOffset={16}
            alignOffset={0}
            onCloseAutoFocus={(e) => {
                e.preventDefault()
                onSubCommandHide?.()
            }}
        >
            <div className='command-submenu'>
                <ResultsRender items={results}
                               maxHeight={200}
                               height='auto'
                               handleKeyEvent={true}
                               setActiveIndex={setActiveIndex}
                               search=""
                               setSearch={() => {}}
                               setRootActionId={setRootActionId}
                               currentRootActionId={state.rootActionId}
                               activeIndex={state.activeIndex}
                               onRender={({item, active}) => {
                                   if (typeof item === "string") {
                                       return <div>{item}</div>
                                   }

                                   return <RenderItem
                                       active={active}
                                       action={item}
                                       currentRootActionId={state.rootActionId ?? ''}
                                   />
                               }
                               }
                />
            </div>
        </Popover.Content>
    </Popover.Root>
}

