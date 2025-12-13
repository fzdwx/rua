/**
 * Rua Extension API Types
 *
 * Shared types between the host application and extension iframes.
 * These types define the contract for Rua-specific APIs.
 */

/** Extension metadata */
export interface ExtensionMeta {
    id: string;
    name: string;
    version: string;
}

/** Dynamic action definition */
export interface DynamicAction {
    id: string;
    name: string;
    keywords?: string[];
    icon?: string;
    subtitle?: string;
    mode: 'view' | 'command';
}

/**
 * Action created from manifest definition
 * Used when loading actions from extension manifest
 */
export interface ManifestDerivedAction {
    /** Full namespaced ID (extension-id.action-name) */
    id: string;
    /** Display title */
    name: string;
    /** Action mode */
    mode: 'view' | 'command';
    /** Search keywords */
    keywords?: string;
    /** Icon */
    icon?: string;
    /** Subtitle */
    subtitle?: string;
    /** Keyboard shortcut */
    shortcut?: string[];
    /** Extension ID */
    extensionId: string;
    /** Original action name from manifest */
    actionName: string;
    /** UI entry URL (for view mode) */
    uiEntry?: string;
    /** Script path (for command mode) */
    script?: string;
}

/** Event handler type */
export type EventHandler = (data: unknown) => void;

/**
 * Rua API interface (client-side)
 * This is what extensions use via window.rua
 */
export interface RuaClientAPI {
    extension: ExtensionMeta;

    clipboard: {
        readText(): Promise<string>;
        writeText(text: string): Promise<void>;
    };

    notification: {
        show(options: { title: string; body?: string }): Promise<void>;
    };

    storage: {
        get<T>(key: string): Promise<T | null>;
        set<T>(key: string, value: T): Promise<void>;
        remove(key: string): Promise<void>;
    };

    ui: {
        hideInput(): Promise<void>;
        showInput(): Promise<void>;
        close(): Promise<void>;
        setTitle(title: string): Promise<void>;
    };

    actions: {
        register(actions: DynamicAction[]): Promise<void>;
        unregister(actionIds: string[]): Promise<void>;
    };

    on(event: string, handler: EventHandler): void;

    off(event: string, handler: EventHandler): void;
}

/**
 * Rua API methods (server-side / host)
 * These are the raw RPC methods exposed to extensions
 */
export interface RuaServerAPI {
    // Extension info
    getExtensionInfo(): Promise<ExtensionMeta>;

    // Clipboard API
    clipboardReadText(): Promise<string>;

    clipboardWriteText(text: string): Promise<void>;

    // Notification API
    notificationShow(options: { title: string; body?: string }): Promise<void>;

    // Storage API
    storageGet(key: string): Promise<string | null>;

    storageSet(key: string, value: string): Promise<void>;

    storageRemove(key: string): Promise<void>;

    // UI API
    uiHideInput(): Promise<void>;

    uiShowInput(): Promise<void>;

    uiClose(): Promise<void>;

    uiSetTitle(title: string): Promise<void>;

    // Actions API
    actionsRegister(actions: DynamicAction[]): Promise<void>;

    actionsUnregister(actionIds: string[]): Promise<void>;
}

/** Callbacks for UI control from host side */
export interface RuaHostCallbacks {
    onHideInput?: () => void;
    onShowInput?: () => void;
    onClose?: () => void;
    onSetTitle?: (title: string) => void;
    onRegisterActions?: (actions: DynamicAction[]) => void;
    onUnregisterActions?: (actionIds: string[]) => void;
}

/** Extension info for the host */
export interface ExtensionHostInfo {
    id: string;
    name: string;
    version: string;
    permissions: string[];
}
