import { useState, useCallback } from 'react';
import { Action } from '../types';

export interface UseActionsResult {
  actions: Action[];
  activeIndex: number;
  setActiveIndex: (index: number | ((prev: number) => number)) => void;
  executeAction: (action: Action) => void;
  incrementIndex: (maxIndex: number) => void;
  decrementIndex: () => void;
}

/**
 * Hook for managing actions and active index
 */
export function useActions(initialActions: Action[] = []): UseActionsResult {
  const [actions] = useState<Action[]>(initialActions);
  const [activeIndex, setActiveIndex] = useState(0);

  const executeAction = useCallback((action: Action) => {
    action.onAction();
  }, []);

  const incrementIndex = useCallback((maxIndex: number) => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, []);

  const decrementIndex = useCallback(() => {
    setActiveIndex((prev) => (prev <= 0 ? 0 : prev - 1));
  }, []);

  return {
    actions,
    activeIndex,
    setActiveIndex,
    executeAction,
    incrementIndex,
    decrementIndex,
  };
}
