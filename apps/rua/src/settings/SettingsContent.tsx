/**
 * Settings Content Area
 *
 * Displays preference fields for the selected category
 */

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { PreferenceFormField } from "./PreferenceFormField";
import { useTheme } from "@/hooks/useTheme";
import type { SettingsCategory } from "./Settings";

interface SettingsContentProps {
  category: SettingsCategory;
}

export function SettingsContent({ category }: SettingsContentProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();

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
      for (const [key, value] of Object.entries(prefs)) {
        try {
          parsedValues[key] = JSON.parse(value);
        } catch {
          parsedValues[key] = value;
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
        <div className="text-[var(--gray11)]">
          No preferences available for this category.
        </div>
      )}
    </div>
  );
}
