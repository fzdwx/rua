import {Action, ActionImpl, Input, RenderItem, ResultsRender, useActionStore, useMatches} from ".";
import * as React from "react";
import {useEffect, useState} from "react";
import {useKeyPress} from "ahooks";
import {
    Popover,
    PopoverTrigger,
    PopoverPanel,
} from '@/components/animate-ui/components/base/popover';
import {Icon} from "@iconify/react";
import { Kbd } from "@/components/ui/kbd"

export const Footer: React.FC<{
    current: string | ActionImpl | null,
    icon: string | React.ReactElement
    actions: (current: string | ActionImpl | null, changeVisible: () => void) => Action[]
    content: (current?: string | ActionImpl | null) => string | React.ReactElement
    onSubCommandHide?: () => void
    onSubCommandShow?: () => void
    mainInputRef?: React.RefObject<HTMLInputElement | null>
    settings?: Action[]  // Settings actions for settings menu
    rightElement?: React.ReactElement  // Custom element to display on the right side
}> = ({
          current,
          actions,
          icon,
          content,
          onSubCommandShow,
          onSubCommandHide,
          mainInputRef,
          settings,
          rightElement
      }) => {
    return <div className='command-footer'>
        <div className='command-footer-icon'>
            {icon}
        </div>
        <div style={{marginRight: 'auto'}}>
            {content(current)}
        </div>

        {rightElement && (
            <>
                {rightElement}
            </>
        )}

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

    return <Popover open={open} onOpenChangeComplete={e => {
        if (!e) {
            onSubCommandHide?.()
            // Use setTimeout to ensure focus happens after popover is fully closed
            setTimeout(() => {
                mainInputRef?.current?.focus()
            }, 100)
        }
    }} onOpenChange={(e) => {
        setOpen(e)
    }} modal>
        <PopoverTrigger className='command-subcommand-trigger' onClick={changeVisible} aria-expanded={open}>
            <span>Actions</span>
            {shortcut.split('.').map((s, i) => <Kbd key={i}>{s}</Kbd>)}
        </PopoverTrigger>

        <PopoverPanel
            side="top"
            align="end"
            sideOffset={16}
            alignOffset={-52}
            className="border-none"
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
        </PopoverPanel>
    </Popover>
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
          mainInputRef
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

    return <Popover open={open} onOpenChangeComplete={e => {
        if (!e) {
            onSubCommandHide?.()
            // Use setTimeout to ensure focus happens after popover is fully closed
            setTimeout(() => {
                mainInputRef?.current?.focus()
            }, 100)
        }
    }}  onOpenChange={(e) => {
        setOpen(e)
    }} modal>
        <PopoverTrigger
            className='command-settings-trigger'
            onClick={changeVisible}
            aria-expanded={open}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--gray12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--gray11)';
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px'
            }}>
                <Icon icon="tabler:settings" style={{fontSize: '18px'}}/>
            </div>
        </PopoverTrigger>
        <PopoverPanel
            side="top"
            align="end"
            sideOffset={16}
            alignOffset={0}
            className="border-none"
        >
            <div className='command-submenu'>
                <ResultsRender items={results}
                               maxHeight={200}
                               height='auto'
                               handleKeyEvent={true}
                               setActiveIndex={setActiveIndex}
                               search=""
                               setSearch={() => {
                               }}
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
        </PopoverPanel>
    </Popover>
}

