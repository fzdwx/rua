import {useMemo, useState} from "react";
import {Action, UseRegisterActions} from "../../command";


export interface Application {
    name: string;
    exec: string;
    terminal: boolean;
    type: string;
    icon: string;
    count: number;
    description?: string;
}

export const useRegisterApps = (useRegisterActions: UseRegisterActions) => {
    const [apps, setApps] = useState<Application[]>([])
    // const parent = {id: "application", name: "application", section: "Documentation"} as Action
    const actions = useMemo(() => {
        return (apps?.map(
            (app): Action => ({
                id: `app-${app.name}`,
                name: app.name ?? '',
                item: app,
                priority: app.count,
                perform: () => {
                    runApplication(app)
                },
                icon: <AppImage app={app}/>,
        kind: ApplicationKind
    }),
    ));
    }, [apps]);

    useRegisterActions(actions, [actions]);

    useEffect(() => {
        getApplications().then(e => {
            setApps(e)
        })
    }, [])
}

const AppImage = ({app}: { app: Application }) => {
    const image = getIcon(app)
    if (image) {
        return (<>
            <img alt="icon" className="w-4" src={image}/>
        </>)
    }
    return (
        <></>
    )
}

const runApplication = (app: Application) => {
    const commands = app.exec
        .replace("%u", "").replace("%U", "")
        .replace("%f", "").replace("%F", "")
        .trim()

    execCommand(commands, [], app.terminal)
    window.launcher.hide()
    addAppRunCount(app)
}
