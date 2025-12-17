import { useEffect, useCallback } from 'react';

export interface UseKeyboardOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard navigation
 */
export function useKeyboard({
  onArrowUp,
  onArrowDown,
  onEnter,
  onEscape,
  enabled = true,
}: UseKeyboardOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.();
          break;
        case 'Enter':
          event.preventDefault();
          onEnter?.();
          break;
        case 'Escape':
          event.preventDefault();
          onEscape?.();
          break;
      }
    },
    [enabled, onArrowUp, onArrowDown, onEnter, onEscape]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return { handleKeyDown };
}
