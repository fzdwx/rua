/**
 * System Configuration Hook
 *
 * Provides a unified API for managing system configuration with cross-window synchronization.
 * Automatically handles event emission and listening for configuration changes.
 */

import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const SYSTEM_NAMESPACE = "system";

/**
 * Event payload for system configuration changes
 */
interface SystemConfigChangedEvent {
  key: string;
  value: unknown;
}

/**
 * Get a system configuration value
 */
export async function getSystemConfig<T = unknown>(key: string, namespace: string = SYSTEM_NAMESPACE): Promise<T | null> {
  try {
    const value = await invoke<string | null>("get_preference", {
      namespace,
      key,
    });

    if (value === null) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to get system config "${key}" from namespace "${namespace}":`, error);
    return null;
  }
}

/**
 * Set a system configuration value and notify all windows
 */
export async function setSystemConfig(key: string, value: unknown, namespace: string = SYSTEM_NAMESPACE): Promise<void> {
  try {
    // Save to preferences
    await invoke("set_preference", {
      namespace,
      key,
      value: JSON.stringify(value),
    });

    // Broadcast event to ALL windows using Tauri backend (namespace-isolated)
    // Replace . with / in namespace for event name (Tauri only allows alphanumeric, -, /, :, _)
    const eventNamespace = namespace.replace(/\./g, "/");
    await invoke("broadcast_event", {
      eventName: `rua://config-changed:${eventNamespace}`,
      payload: { key, value },
    });
  } catch (error) {
    console.error(`Failed to set system config "${key}" in namespace "${namespace}":`, error);
    throw error;
  }
}

/**
 * Hook for managing system configuration with automatic cross-window sync
 *
 * @param key - Configuration key
 * @param defaultValue - Default value if not set
 * @param onConfigChange - Optional callback when config changes from other windows
 * @param namespace - Optional namespace (defaults to "system")
 * @returns [value, setValue, loading] tuple
 *
 * @example
 * ```tsx
 * const [theme, setTheme, loading] = useSystemConfig<"light" | "dark" | "system">(
 *   "theme",
 *   "system",
 *   (newTheme) => {
 *     console.log("Theme changed from another window:", newTheme);
 *   }
 * );
 * ```
 */
export function useSystemConfig<T = unknown>(
  key: string,
  defaultValue?: T,
  onConfigChange?: (value: T) => void,
  namespace: string = SYSTEM_NAMESPACE
): [T | null, (value: T) => Promise<void>, boolean] {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      setLoading(true);
      try {
        const storedValue = await getSystemConfig<T>(key, namespace);
        setValue(storedValue ?? defaultValue ?? null);
      } catch (error) {
        console.error(`Failed to load system config "${key}" from namespace "${namespace}":`, error);
        setValue(defaultValue ?? null);
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [key, defaultValue, namespace]);

  // Listen for config changes from other windows
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    // Replace . with / in namespace for event name (Tauri only allows alphanumeric, -, /, :, _)
    const eventNamespace = namespace.replace(/\./g, "/");
    getCurrentWebviewWindow()
      .listen<SystemConfigChangedEvent>(`rua://config-changed:${eventNamespace}`, (event) => {
        if (event.payload.key === key) {
          const newValue = event.payload.value as T;
          setValue(newValue);
          onConfigChange?.(newValue);
        }
      })
      .then((unlistenFn) => {
        unlisten = unlistenFn;
      });

    return () => {
      unlisten?.();
    };
  }, [key, onConfigChange, namespace]);

  // Update value and notify other windows
  const updateValue = useCallback(
    async (newValue: T) => {
      setValue(newValue);
      await setSystemConfig(key, newValue, namespace);
    },
    [key, namespace]
  );

  return [value, updateValue, loading];
}
