/**
 * Settings Content Area
 *
 * Displays preference fields for the selected category
 */

import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { PreferenceFormField } from "./PreferenceFormField";
import { useTheme } from "@/hooks/useTheme";
import type { SettingsCategory } from "./Settings";
import type { FileSearchConfig } from "rua-api";

interface SettingsContentProps {
  category: SettingsCategory;
}

export function SettingsContent({ category }: SettingsContentProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * System configuration handlers
   * Register handlers for system configurations that need immediate local processing
   */
  const systemConfigHandlers: Record<string, (value: unknown) => void | Promise<void>> = {
    theme: (value: unknown) => {
      // Apply theme immediately to current window
      const theme = value as "light" | "dark" | "system";
      setTheme(theme);
    },
    // Add more handlers here as needed:
    // openAtLogin: async (value: unknown) => {
    //   // Handle openAtLogin setting
    // },
    // hotkey: async (value: unknown) => {
    //   // Handle hotkey setting
    // },
  };

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const namespace = category.type === "system" ? "system" : category.extensionId!;
      const prefs = await invoke<Record<string, string>>("get_all_preferences", {
        namespace,
      });

      const parsedValues: Record<string, unknown> = {};

      // Special handling for file-search category
      if (category.id === "file-search" && prefs.fileSearch) {
        const fileSearchConfig = JSON.parse(prefs.fileSearch) as FileSearchConfig;
        // Destructure composite object into individual fields for form display
        parsedValues.enabled = fileSearchConfig.enabled;
        parsedValues.maxResults = fileSearchConfig.maxResults;
        parsedValues.threshold = fileSearchConfig.threshold;
        parsedValues.openMethod = fileSearchConfig.openMethod;
        parsedValues.customPaths = fileSearchConfig.customPaths;
      } else {
        // Normal handling for other categories
        for (const [key, value] of Object.entries(prefs)) {
          try {
            parsedValues[key] = JSON.parse(value);
          } catch {
            parsedValues[key] = value;
          }
        }
      }

      setValues(parsedValues);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = async (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));

    // Special handling for file-search category with longer debounce (2 seconds)
    if (category.id === "file-search") {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        // Read from updated values state using functional update
        setValues((currentValues) => {
          const fullConfig: FileSearchConfig = {
            enabled: (currentValues.enabled ?? true) as boolean,
            maxResults: (currentValues.maxResults ?? 20) as number,
            threshold: (currentValues.threshold ?? 5) as number,
            openMethod: (currentValues.openMethod ?? "xdg-open") as "xdg-open" | "system",
            customPaths: (currentValues.customPaths ?? []) as string[],
          };

          // Save preferences
          invoke("set_preference", {
            namespace: "system",
            key: "fileSearch",
            value: JSON.stringify(fullConfig),
          }).then(() => {
            // Broadcast event after successful save
            return invoke("broadcast_event", {
              eventName: "rua://system-config-changed",
              payload: { key: "fileSearch", value: fullConfig },
            });
          }).catch((error) => {
            console.error("Failed to save file search config:", error);
          });

          return currentValues; // Return unchanged values
        });
      }, 2000); // 2 second debounce

      return;
    }

    // Original behavior for other categories (immediate save)
    try {
      const namespace = category.type === "system" ? "system" : category.extensionId!;

      // Save to preferences
      await invoke("set_preference", {
        namespace,
        key: name,
        value: JSON.stringify(value),
      });

      // Handle system configurations
      if (namespace === "system") {
        // Execute local handler if exists
        const handler = systemConfigHandlers[name];
        if (handler) {
          await handler(value);
        }

        // Broadcast system config change to all windows
        try {
          await invoke("broadcast_event", {
            eventName: "rua://system-config-changed",
            payload: { key: name, value },
          });
        } catch (e) {
          console.error(`Failed to broadcast system config change for "${name}":`, e);
        }
      }
    } catch (error) {
      console.error("Failed to save preference:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-[var(--gray11)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl p-8">
      <h2 className="text-2xl font-bold text-[var(--gray12)] mb-6">{category.name}</h2>

      {category.preferences && category.preferences.length > 0 ? (
        <div className="space-y-6">
          {category.preferences.map((preference) => (
            <PreferenceFormField
              key={preference.name}
              preference={preference}
              value={values[preference.name]}
              onChange={(value) => handleValueChange(preference.name, value)}
            />
          ))}
        </div>
      ) : (
        <div className="text-[var(--gray11)]">No preferences available for this category.</div>
      )}
    </div>
  );
}
