import { useState, useCallback, createContext, useContext, ReactElement, ReactNode } from 'react';

interface NavigationContextValue {
  views: ReactElement[];
  currentIndex: number;
  push: (view: ReactElement) => void;
  pop: () => void;
  canPop: boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export interface NavigationProviderProps {
  children: ReactNode;
  initialView?: ReactElement;
}

/**
 * Navigation provider component
 */
export function NavigationProvider({ children, initialView }: NavigationProviderProps) {
  const [views, setViews] = useState<ReactElement[]>(initialView ? [initialView] : []);
  const [currentIndex, setCurrentIndex] = useState(0);

  const push = useCallback((view: ReactElement) => {
    setViews((prev) => [...prev, view]);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const pop = useCallback(() => {
    if (views.length > 1) {
      setViews((prev) => prev.slice(0, -1));
      setCurrentIndex((prev) => prev - 1);
    }
  }, [views.length]);

  const canPop = views.length > 1;

  return (
    <NavigationContext.Provider value={{ views, currentIndex, push, pop, canPop }}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook for navigation between views
 */
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return {
    push: context.push,
    pop: context.pop,
    canPop: context.canPop,
  };
}

/**
 * Hook to get the current view
 */
export function useCurrentView(): ReactElement | null {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useCurrentView must be used within a NavigationProvider');
  }
  return context.views[context.currentIndex] || null;
}
