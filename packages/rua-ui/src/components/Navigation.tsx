import React from 'react';
import { useCurrentView, NavigationProvider } from '../hooks/useNavigation';

/**
 * Navigation component that renders the current view
 */
export function Navigation({ children }: { children: React.ReactNode }) {
  return <NavigationProvider>{children}</NavigationProvider>;
}

/**
 * NavigationView component that displays the current active view
 */
export function NavigationView() {
  const currentView = useCurrentView();
  return <>{currentView}</>;
}
