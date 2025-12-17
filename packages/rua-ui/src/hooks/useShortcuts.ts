import { useEffect, useCallback, useRef } from 'react';
import type { KeyboardShortcut } from '../types';

/**
 * Handler function for keyboard shortcuts
 */
export type ShortcutHandler = () => void | Promise<void>;

/**
 * Registered shortcut entry
 */
interface ShortcutEntry {
  shortcut: KeyboardShortcut;
  handler: ShortcutHandler;
  priority: number;
}

/**
 * Global shortcut registry for managing keyboard shortcuts
 */
class ShortcutRegistry {
  private shortcuts: Map<string, ShortcutEntry[]> = new Map();
  private enabled: boolean = true;
  private listener: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.setupGlobalListener();
  }

  /**
   * Normalize a shortcut to a consistent string key
   */
  normalizeShortcut(shortcut: KeyboardShortcut): string {
    const mods = shortcut.modifiers || [];
    // Order: cmd → ctrl → alt → shift → key
    const orderedMods = ['cmd', 'ctrl', 'alt', 'shift'].filter(m =>
      mods.includes(m as 'cmd' | 'ctrl' | 'alt' | 'shift')
    );
    return [...orderedMods, shortcut.key.toLowerCase()].join('+');
  }

  /**
   * Format a shortcut for display
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const mods = shortcut.modifiers || [];
    // Order: cmd → ctrl → alt → shift → key
    const orderedMods = ['cmd', 'ctrl', 'alt', 'shift'].filter(m =>
      mods.includes(m as 'cmd' | 'ctrl' | 'alt' | 'shift')
    );

    const modStrings = orderedMods.map((mod) => {
      switch (mod) {
        case 'cmd':
          return '⌘';
        case 'ctrl':
          return 'Ctrl';
        case 'alt':
          return 'Alt';
        case 'shift':
          return 'Shift';
        default:
          return mod;
      }
    });
    return [...modStrings, shortcut.key.toUpperCase()].join('+');
  }

  /**
   * Check if a keyboard event matches a shortcut
   */
  matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const mods = shortcut.modifiers || [];
    const key = shortcut.key.toLowerCase();

    // Check key match
    const eventKey = event.key.toLowerCase();
    if (eventKey !== key) {
      return false;
    }

    // Check modifiers
    const cmdRequired = mods.includes('cmd');
    const ctrlRequired = mods.includes('ctrl');
    const altRequired = mods.includes('alt');
    const shiftRequired = mods.includes('shift');

    // On macOS, cmd is metaKey; on other platforms, we treat cmd as metaKey too
    const cmdPressed = event.metaKey;
    const ctrlPressed = event.ctrlKey;
    const altPressed = event.altKey;
    const shiftPressed = event.shiftKey;

    return (
      cmdRequired === cmdPressed &&
      ctrlRequired === ctrlPressed &&
      altRequired === altPressed &&
      shiftRequired === shiftPressed
    );
  }

  /**
   * Setup global keyboard event listener
   */
  private setupGlobalListener(): void {
    if (typeof window === 'undefined') return;

    this.listener = (event: KeyboardEvent) => {
      if (!this.enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow shortcuts with cmd/ctrl modifier even in input fields
        if (!event.metaKey && !event.ctrlKey) {
          return;
        }
      }

      // Find matching shortcuts
      for (const [, entries] of this.shortcuts) {
        // Sort by priority (higher first)
        const sortedEntries = [...entries].sort((a, b) => b.priority - a.priority);

        for (const entry of sortedEntries) {
          if (this.matchesShortcut(event, entry.shortcut)) {
            event.preventDefault();
            event.stopPropagation();

            try {
              const result = entry.handler();
              if (result instanceof Promise) {
                result.catch((error) => {
                  console.error('[ShortcutRegistry] Error executing shortcut handler:', error);
                });
              }
            } catch (error) {
              console.error('[ShortcutRegistry] Error executing shortcut handler:', error);
            }

            return; // Only trigger the first matching handler
          }
        }
      }
    };

    window.addEventListener('keydown', this.listener, true);
  }

  /**
   * Register a keyboard shortcut
   * @returns Unregister function
   */
  register(shortcut: KeyboardShortcut, handler: ShortcutHandler, priority: number = 0): () => void {
    const key = this.normalizeShortcut(shortcut);
    const entry: ShortcutEntry = { shortcut, handler, priority };

    if (!this.shortcuts.has(key)) {
      this.shortcuts.set(key, []);
    }
    this.shortcuts.get(key)!.push(entry);

    // Return unregister function
    return () => {
      this.unregister(shortcut, handler);
    };
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(shortcut: KeyboardShortcut, handler?: ShortcutHandler): void {
    const key = this.normalizeShortcut(shortcut);
    const entries = this.shortcuts.get(key);

    if (!entries) return;

    if (handler) {
      // Remove specific handler
      const index = entries.findIndex((e) => e.handler === handler);
      if (index !== -1) {
        entries.splice(index, 1);
      }
    } else {
      // Remove all handlers for this shortcut
      this.shortcuts.delete(key);
    }

    // Clean up empty entries
    if (entries && entries.length === 0) {
      this.shortcuts.delete(key);
    }
  }

  /**
   * Check if a shortcut is registered
   */
  isRegistered(shortcut: KeyboardShortcut): boolean {
    const key = this.normalizeShortcut(shortcut);
    return this.shortcuts.has(key) && this.shortcuts.get(key)!.length > 0;
  }

  /**
   * Enable or disable the shortcut registry
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get all registered shortcuts
   */
  getRegisteredShortcuts(): KeyboardShortcut[] {
    const shortcuts: KeyboardShortcut[] = [];
    for (const entries of this.shortcuts.values()) {
      if (entries.length > 0) {
        shortcuts.push(entries[0].shortcut);
      }
    }
    return shortcuts;
  }

  /**
   * Clear all registered shortcuts
   */
  clear(): void {
    this.shortcuts.clear();
  }

  /**
   * Destroy the registry and remove event listener
   */
  destroy(): void {
    if (this.listener && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.listener, true);
      this.listener = null;
    }
    this.clear();
  }
}

// Global singleton instance
let globalRegistry: ShortcutRegistry | null = null;

/**
 * Get the global shortcut registry instance
 */
export function getShortcutRegistry(): ShortcutRegistry {
  if (!globalRegistry) {
    globalRegistry = new ShortcutRegistry();
  }
  return globalRegistry;
}

/**
 * Options for useShortcut hook
 */
export interface UseShortcutOptions {
  /** Whether the shortcut is enabled */
  enabled?: boolean;
  /** Priority for this shortcut (higher = handled first) */
  priority?: number;
}

/**
 * Hook to register a keyboard shortcut
 * @param shortcut The keyboard shortcut to register
 * @param handler The handler function to call when the shortcut is pressed
 * @param options Additional options
 */
export function useShortcut(
  shortcut: KeyboardShortcut | undefined,
  handler: ShortcutHandler,
  options: UseShortcutOptions = {}
): void {
  const { enabled = true, priority = 0 } = options;
  const handlerRef = useRef(handler);

  // Keep handler ref up to date
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!shortcut || !enabled) return;

    const registry = getShortcutRegistry();
    const wrappedHandler = () => handlerRef.current();

    const unregister = registry.register(shortcut, wrappedHandler, priority);

    return unregister;
  }, [shortcut, enabled, priority]);
}

/**
 * Hook to register multiple keyboard shortcuts
 * @param shortcuts Array of shortcut configurations
 */
export function useShortcuts(
  shortcuts: Array<{
    shortcut: KeyboardShortcut;
    handler: ShortcutHandler;
    enabled?: boolean;
    priority?: number;
  }>
): void {
  const shortcutsRef = useRef(shortcuts);

  // Keep shortcuts ref up to date
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const registry = getShortcutRegistry();
    const unregisterFns: Array<() => void> = [];

    for (const config of shortcutsRef.current) {
      if (config.enabled === false) continue;

      const unregister = registry.register(
        config.shortcut,
        config.handler,
        config.priority || 0
      );
      unregisterFns.push(unregister);
    }

    return () => {
      for (const unregister of unregisterFns) {
        unregister();
      }
    };
  }, [shortcuts]);
}

/**
 * Hook to get shortcut registry utilities
 */
export function useShortcutRegistry() {
  const registry = getShortcutRegistry();

  const register = useCallback(
    (shortcut: KeyboardShortcut, handler: ShortcutHandler, priority?: number) => {
      return registry.register(shortcut, handler, priority);
    },
    [registry]
  );

  const unregister = useCallback(
    (shortcut: KeyboardShortcut, handler?: ShortcutHandler) => {
      registry.unregister(shortcut, handler);
    },
    [registry]
  );

  const isRegistered = useCallback(
    (shortcut: KeyboardShortcut) => {
      return registry.isRegistered(shortcut);
    },
    [registry]
  );

  const formatShortcut = useCallback(
    (shortcut: KeyboardShortcut) => {
      return registry.formatShortcut(shortcut);
    },
    [registry]
  );

  return {
    register,
    unregister,
    isRegistered,
    formatShortcut,
    setEnabled: registry.setEnabled.bind(registry),
    getRegisteredShortcuts: registry.getRegisteredShortcuts.bind(registry),
  };
}
