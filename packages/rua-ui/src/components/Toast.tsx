import { ReactNode, createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { KeyboardShortcut } from '../types';

/**
 * Toast style enum matching Raycast's Toast.Style
 */
export const ToastStyle = {
  Success: 'success',
  Failure: 'failure',
  Animated: 'animated',
} as const;

export type ToastStyleType = typeof ToastStyle[keyof typeof ToastStyle];

/**
 * Toast action configuration
 */
export interface ToastAction {
  /** Action title */
  title: string;
  /** Callback when action is triggered */
  onAction: () => void;
  /** Keyboard shortcut */
  shortcut?: KeyboardShortcut;
}

/**
 * Toast options for showToast function
 */
export interface ToastOptions {
  /** Toast style (Success, Failure, Animated) */
  style?: ToastStyleType;
  /** Toast title (required) */
  title: string;
  /** Optional message/description */
  message?: string;
  /** Primary action button */
  primaryAction?: ToastAction;
  /** Secondary action button */
  secondaryAction?: ToastAction;
}

/**
 * Toast instance returned by showToast
 */
export interface ToastInstance {
  /** Hide the toast */
  hide: () => void;
  /** Update toast title */
  title: string;
  /** Update toast message */
  message?: string;
  /** Update toast style */
  style?: ToastStyleType;
}


/**
 * Internal toast state
 */
interface ToastState {
  id: string;
  style: ToastStyleType;
  title: string;
  message?: string;
  primaryAction?: ToastAction;
  secondaryAction?: ToastAction;
  visible: boolean;
}

/**
 * Toast context value
 */
interface ToastContextValue {
  toasts: ToastState[];
  addToast: (options: ToastOptions) => ToastInstance;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<ToastOptions>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global toast registry for use outside React context
let globalToastHandler: ((options: ToastOptions) => ToastInstance) | null = null;

/**
 * Register global toast handler (called by ToastProvider)
 */
function registerGlobalToastHandler(handler: (options: ToastOptions) => ToastInstance) {
  globalToastHandler = handler;
}

/**
 * Unregister global toast handler
 */
function unregisterGlobalToastHandler() {
  globalToastHandler = null;
}

/**
 * Generate unique toast ID
 */
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Toast Provider component
 * Wrap your app with this to enable toast notifications
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastsRef = useRef<ToastState[]>([]);
  
  // Keep ref in sync with state
  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const updateToast = useCallback((id: string, updates: Partial<ToastOptions>) => {
    setToasts(prev => prev.map(t => 
      t.id === id 
        ? { ...t, ...updates }
        : t
    ));
  }, []);
  
  const addToast = useCallback((options: ToastOptions): ToastInstance => {
    if (!options.title) {
      throw new Error('[Toast] title is required');
    }
    
    const id = generateToastId();
    const style = options.style || ToastStyle.Success;
    
    const newToast: ToastState = {
      id,
      style,
      title: options.title,
      message: options.message,
      primaryAction: options.primaryAction,
      secondaryAction: options.secondaryAction,
      visible: true,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-hide after 4 seconds for non-animated toasts
    if (style !== ToastStyle.Animated) {
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    }
    
    // Return toast instance for programmatic control
    const instance: ToastInstance = {
      hide: () => removeToast(id),
      get title() {
        const toast = toastsRef.current.find(t => t.id === id);
        return toast?.title || options.title;
      },
      set title(value: string) {
        updateToast(id, { title: value });
      },
      get message() {
        const toast = toastsRef.current.find(t => t.id === id);
        return toast?.message;
      },
      set message(value: string | undefined) {
        updateToast(id, { message: value });
      },
      get style() {
        const toast = toastsRef.current.find(t => t.id === id);
        return toast?.style;
      },
      set style(value: ToastStyleType | undefined) {
        if (value) {
          updateToast(id, { style: value });
        }
      },
    };
    
    return instance;
  }, [removeToast, updateToast]);
  
  // Register global handler
  useEffect(() => {
    registerGlobalToastHandler(addToast);
    return () => unregisterGlobalToastHandler();
  }, [addToast]);
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}


/**
 * Hook to access toast context
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('[useToast] must be used within a ToastProvider');
  }
  return context;
}

/**
 * Toast container component that renders all active toasts
 */
function ToastContainer({ 
  toasts, 
  onRemove 
}: { 
  toasts: ToastState[]; 
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }
  
  return (
    <div className="rua-toast-container" role="region" aria-label="Notifications">
      {toasts.map(toast => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onClose={() => onRemove(toast.id)} 
        />
      ))}
    </div>
  );
}

/**
 * Individual toast item component
 */
function ToastItem({ 
  toast, 
  onClose 
}: { 
  toast: ToastState; 
  onClose: () => void;
}) {
  const styleClass = `rua-toast rua-toast-${toast.style}`;
  
  return (
    <div 
      className={styleClass}
      role="alert"
      aria-live={toast.style === ToastStyle.Failure ? 'assertive' : 'polite'}
    >
      <div className="rua-toast-icon">
        {toast.style === ToastStyle.Success && <SuccessIcon />}
        {toast.style === ToastStyle.Failure && <FailureIcon />}
        {toast.style === ToastStyle.Animated && <AnimatedIcon />}
      </div>
      <div className="rua-toast-content">
        <div className="rua-toast-title">{toast.title}</div>
        {toast.message && (
          <div className="rua-toast-message">{toast.message}</div>
        )}
      </div>
      <div className="rua-toast-actions">
        {toast.primaryAction && (
          <button 
            className="rua-toast-action rua-toast-action-primary"
            onClick={() => {
              toast.primaryAction?.onAction();
              onClose();
            }}
          >
            {toast.primaryAction.title}
          </button>
        )}
        {toast.secondaryAction && (
          <button 
            className="rua-toast-action rua-toast-action-secondary"
            onClick={() => {
              toast.secondaryAction?.onAction();
              onClose();
            }}
          >
            {toast.secondaryAction.title}
          </button>
        )}
      </div>
      <button 
        className="rua-toast-close" 
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Success icon component
 */
function SuccessIcon() {
  return (
    <svg 
      className="rua-toast-icon-svg rua-toast-icon-success" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Failure icon component
 */
function FailureIcon() {
  return (
    <svg 
      className="rua-toast-icon-svg rua-toast-icon-failure" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Animated loading icon component
 */
function AnimatedIcon() {
  return (
    <svg 
      className="rua-toast-icon-svg rua-toast-icon-animated" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path 
        d="M12 2a10 10 0 0 1 10 10" 
        strokeLinecap="round"
        className="rua-toast-spinner"
      />
    </svg>
  );
}


/**
 * Show a toast notification
 * 
 * @example
 * // Simple usage
 * showToast({ title: "Success!", style: Toast.Style.Success });
 * 
 * // With message
 * showToast({ 
 *   title: "File saved", 
 *   message: "Your changes have been saved",
 *   style: Toast.Style.Success 
 * });
 * 
 * // With actions
 * showToast({
 *   title: "Error",
 *   message: "Failed to save file",
 *   style: Toast.Style.Failure,
 *   primaryAction: {
 *     title: "Retry",
 *     onAction: () => saveFile()
 *   }
 * });
 * 
 * // Overloaded signature
 * showToast(Toast.Style.Success, "Success!", "Operation completed");
 */
export function showToast(options: ToastOptions): Promise<ToastInstance>;
export function showToast(style: ToastStyleType, title: string, message?: string): Promise<ToastInstance>;
export function showToast(
  optionsOrStyle: ToastOptions | ToastStyleType,
  title?: string,
  message?: string
): Promise<ToastInstance> {
  return new Promise((resolve, reject) => {
    // Normalize arguments
    let options: ToastOptions;
    
    if (typeof optionsOrStyle === 'string') {
      // Overloaded signature: showToast(style, title, message?)
      if (!title) {
        reject(new Error('[showToast] title is required'));
        return;
      }
      options = {
        style: optionsOrStyle,
        title,
        message,
      };
    } else {
      // Object signature: showToast(options)
      options = optionsOrStyle;
    }
    
    // Validate required fields
    if (!options.title) {
      reject(new Error('[showToast] title is required'));
      return;
    }
    
    // Use global handler if available
    if (globalToastHandler) {
      const instance = globalToastHandler(options);
      resolve(instance);
    } else {
      // Fallback: log warning and create a no-op instance
      console.warn('[showToast] ToastProvider not found. Wrap your app with <ToastProvider>.');
      
      // Create a fallback toast using console
      const style = options.style || ToastStyle.Success;
      const logMethod = style === ToastStyle.Failure ? console.error : console.log;
      logMethod(`[Toast] ${options.title}${options.message ? `: ${options.message}` : ''}`);
      
      // Return a no-op instance
      resolve({
        hide: () => {},
        title: options.title,
        message: options.message,
        style: options.style,
      });
    }
  });
}

/**
 * Toast namespace with Style enum
 * Matches Raycast's Toast API
 */
export const Toast = {
  Style: ToastStyle,
};
