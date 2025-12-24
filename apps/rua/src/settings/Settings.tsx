/**
 * Settings View
 *
 * Main settings interface with sidebar and content area.
 * Displays system preferences and extension preferences.
 */

import { useState, useEffect } from "react";
import { SettingsSidebar } from "./SettingsSidebar";
import { SettingsContent } from "./SettingsContent";
import { useExtensionSystem } from "@/contexts/ExtensionSystemContext";
import { ActionIcon } from "@/extension/ActionIcon";
import type { PreferenceField } from "rua-api";

export interface SettingsCategory {
  id: string;
  name: string;
  icon?: React.ReactNode;
  type: "system" | "builtin" | "extension";
  extensionId?: string;
  preferences?: PreferenceField[];
}

export default function Settings() {
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [categories, setCategories] = useState<SettingsCategory[]>([]);
  const { extensions } = useExtensionSystem();
  useEffect(() => {
    // Load system categories and extension categories
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extensions]);

  const loadCategories = async () => {
    // System categories
    const systemCategories: SettingsCategory[] = [
      {
        id: "general",
        name: "General",
        type: "system",
        preferences: [
          {
            name: "theme",
            title: "Theme",
            description: "Choose your preferred theme",
            type: "dropdown",
            default: "system",
            options: [
              { label: "System", value: "system" },
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
            ],
          },
          {
            name: "openAtLogin",
            title: "Open at Login",
            description: "Automatically launch Rua when you log in",
            type: "toggle",
            default: false,
          },
        ],
      },
      {
        id: "shortcuts",
        name: "Shortcuts",
        type: "system",
        preferences: [
          {
            name: "hotkey",
            title: "Rua Hotkey",
            description: "Global hotkey to show/hide Rua",
            type: "shortcut",
            default: "Alt+Space",
            placeholder: "Click 'Record' to set hotkey",
          },
        ],
      },
      {
        id: "advanced",
        name: "Advanced",
        type: "system",
        preferences: [],
      },
      {
        id: "about",
        name: "About",
        type: "system",
        preferences: [],
      },
    ];

    // Load built-in extension categories
    const builtinCategories: SettingsCategory[] = extensions
      .filter(
        (ext) =>
          ext.enabled &&
          ext.manifest.builtin &&
          ext.manifest.rua.preferences &&
          ext.manifest.rua.preferences.length > 0
      )
      .map((ext) => ({
        id: ext.manifest.id,
        name: ext.manifest.name,
        icon: ext.manifest.icon ? (
          <ActionIcon icon={ext.manifest.icon} extensionPath={ext.path} size="18px" />
        ) : undefined,
        type: "builtin" as const,
        extensionId: ext.manifest.id,
        preferences: ext.manifest.rua.preferences,
      }));

    // Load user-installed extension categories
    const extensionCategories: SettingsCategory[] = extensions
      .filter(
        (ext) =>
          ext.enabled &&
          !ext.manifest.builtin &&
          ext.manifest.rua.preferences &&
          ext.manifest.rua.preferences.length > 0
      )
      .map((ext) => ({
        id: ext.manifest.id,
        name: ext.manifest.name,
        icon: ext.manifest.icon ? (
          <ActionIcon icon={ext.manifest.icon} extensionPath={ext.path} size="18px" />
        ) : undefined,
        type: "extension" as const,
        extensionId: ext.manifest.id,
        preferences: ext.manifest.rua.preferences,
      }));

    // Combine all categories
    setCategories([...systemCategories, ...builtinCategories, ...extensionCategories]);
  };

  const currentCategory = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="flex h-screen bg-[var(--gray1)]">
      {/* Sidebar */}
      <SettingsSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {currentCategory && <SettingsContent category={currentCategory} />}
      </div>
    </div>
  );
}
