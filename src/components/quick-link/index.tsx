import {Action} from "@/command";

export const quickLinkCreatorId = "built-in-quickLinkCreator";

export function getQuickLinkAction(): Action[] {
    return [
        {
            id: quickLinkCreatorId,
            name: "创建快捷指令",
        }
    ]
}

export function QuickLinkCreator() {

    return <div>123</div>
}
