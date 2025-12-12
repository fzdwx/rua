import React from "react";
import {QuickLink} from "@/hooks/useQuickLinks";
import {translateId, TranslateView} from "@/components/translate";
import {weatherId, WeatherView} from "@/components/weather";
import {
    quickLinkCreatorId,
    quickLinkViewPrefix,
    quickLinkEditId,
    QuickLinkCreator,
    QuickLinkView
} from "@/components/quick-link";
import {ViewContext} from "./viewContext";

// View configuration type
export interface ViewConfig {
    key: string;
    match: (rootActionId: string | null) => boolean;
    component: React.ComponentType<any>;
    getProps: (context: ViewContext) => Record<string, any>;
}

// Create view configurations factory
export function createViewConfigs(
    setRootActionId: (id: string | null) => void,
    setSearch: (search: string) => void,
    setRefreshKey: React.Dispatch<React.SetStateAction<number>>,
    inputRef: React.RefObject<HTMLInputElement | null>
): ViewConfig[] {
    // Helper function to create default onReturn handler
    const createDefaultOnReturn = () => {
        return () => {
            setRootActionId(null);
            setSearch("");
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        };
    };

    // Helper function to create quick link onReturn handler (includes refresh)
    const createQuickLinkOnReturn = () => {
        return () => {
            setRootActionId(null);
            setSearch("");
            setRefreshKey(prev => prev + 1);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        };
    };

    return [
        {
            key: "translate",
            match: (id) => id === translateId,
            component: TranslateView,
            getProps: (context) => ({
                search: context.search,
                onLoadingChange: context.handleActionLoadingChange,
                onReturn: createDefaultOnReturn(),
            }),
        },
        {
            key: "weather",
            match: (id) => id === weatherId,
            component: WeatherView,
            getProps: (context) => ({
                search: context.search,
                onLoadingChange: context.handleActionLoadingChange,
                onRequestFocusInput: () => {
                    setTimeout(() => {
                        context.inputRef.current?.focus();
                    }, 50);
                },
                onReturn: createDefaultOnReturn(),
            }),
        },
        {
            key: "quicklink-creator",
            match: (id) => id === quickLinkCreatorId,
            component: QuickLinkCreator,
            getProps: (context) => ({
                onLoadingChange: context.handleActionLoadingChange,
                onReturn: createQuickLinkOnReturn(),
            }),
        },
        {
            key: "quicklink-edit",
            match: (id) => id === quickLinkEditId,
            component: QuickLinkCreator,
            getProps: (context) => ({
                editQuickLink: context.lastActiveMainAction?.item as QuickLink | undefined,
                onLoadingChange: context.handleActionLoadingChange,
                onReturn: createQuickLinkOnReturn(),
            }),
        },
        {
            key: "quicklink-view",
            match: (id) => id?.startsWith(quickLinkViewPrefix) ?? false,
            component: QuickLinkView,
            getProps: (context) => ({
                quickLink: context.currentRootAction?.item,
                search: context.search,
                onLoadingChange: context.handleActionLoadingChange,
                onReturn: () => {
                    context.setRootActionId(null);
                    context.setSearch("");
                },
            }),
        },
    ];
}

