import { createContext, useContext, useState, useCallback } from "react";
import type { ReactElement, ReactNode } from "react";

/**
 * Navigation context value interface
 * Provides navigation stack management for push/pop operations
 */
export interface NavigationContextValue {
  /** Push a new view onto the navigation stack */
  push: (view: ReactElement) => void;
  /** Pop the current view from the navigation stack */
  pop: () => void;
  /** Whether there are views to pop (stack is not empty) */
  canPop: boolean;
  /** Current navigation title */
  navigationTitle?: string;
  /** Set the navigation title */
  setNavigationTitle: (title: string) => void;
}

/**
 * Navigation state interface
 */
interface NavigationState {
  stack: ReactElement[];
  currentIndex: number;
  navigationTitle?: string;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

/**
 * Hook to access navigation context
 * Returns navigation methods for push/pop operations
 *
 * @returns NavigationContextValue with push, pop, canPop, navigationTitle, and setNavigationTitle
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { push, pop, canPop } = useNavigation();
 *
 *   return (
 *     <button onClick={() => push(<DetailView />)}>
 *       View Details
 *     </button>
 *   );
 * }
 * ```
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    // Return a no-op implementation if not in navigation context
    // This allows components to be used outside of NavigationProvider
    return {
      push: () => console.warn("[useNavigation] Navigation push called outside NavigationProvider"),
      pop: () => console.warn("[useNavigation] Navigation pop called outside NavigationProvider"),
      canPop: false,
      navigationTitle: undefined,
      setNavigationTitle: () =>
        console.warn("[useNavigation] setNavigationTitle called outside NavigationProvider"),
    };
  }
  return context;
}

/**
 * Props for NavigationProvider component
 */
export interface NavigationProviderProps {
  /** Child components to render */
  children: ReactNode;
  /** Initial navigation title */
  initialTitle?: string;
}

/**
 * Navigation provider component that manages a navigation stack
 * Wrap your application or component tree with this provider to enable
 * push/pop navigation using Action.Push and Action.Pop components
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <NavigationProvider>
 *       <MainView />
 *     </NavigationProvider>
 *   );
 * }
 * ```
 */
export function NavigationProvider({ children, initialTitle }: NavigationProviderProps) {
  const [state, setState] = useState<NavigationState>({
    stack: [],
    currentIndex: -1,
    navigationTitle: initialTitle,
  });

  /**
   * Push a new view onto the navigation stack
   * The new view will be displayed, replacing the current view
   */
  const push = useCallback((view: ReactElement) => {
    setState((prev) => ({
      ...prev,
      stack: [...prev.stack, view],
      currentIndex: prev.stack.length,
    }));
  }, []);

  /**
   * Pop the current view from the navigation stack
   * Returns to the previous view, or the original children if stack is empty
   */
  const pop = useCallback(() => {
    setState((prev) => {
      if (prev.stack.length === 0) {
        console.warn("[NavigationProvider] Cannot pop: navigation stack is empty");
        return prev;
      }
      return {
        ...prev,
        stack: prev.stack.slice(0, -1),
        currentIndex: prev.stack.length - 2,
      };
    });
  }, []);

  /**
   * Set the navigation title
   */
  const setNavigationTitle = useCallback((title: string) => {
    setState((prev) => ({
      ...prev,
      navigationTitle: title,
    }));
  }, []);

  const canPop = state.stack.length > 0;
  const currentView = state.stack.length > 0 ? state.stack[state.stack.length - 1] : null;

  const contextValue: NavigationContextValue = {
    push,
    pop,
    canPop,
    navigationTitle: state.navigationTitle,
    setNavigationTitle,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {currentView || children}
    </NavigationContext.Provider>
  );
}

/**
 * Export the NavigationContext for advanced use cases
 * Most users should use useNavigation() hook instead
 */
export { NavigationContext };
