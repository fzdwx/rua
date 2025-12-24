/**
 * Settings Sidebar
 *
 * Left sidebar showing settings categories and extensions
 */

import { Icon } from "@iconify/react";
import { cn } from "../../../../packages/rua-ui/src/lib/utils";
import type { SettingsCategory } from "./Settings";

interface SettingsSidebarProps {
  categories: SettingsCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function SettingsSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
}: SettingsSidebarProps) {
  const systemCategories = categories.filter((c) => c.type === "system");
  const builtinCategories = categories.filter((c) => c.type === "builtin");
  const extensionCategories = categories.filter((c) => c.type === "extension");

  return (
    <div className="w-[260px] bg-[var(--gray2)] border-r border-[var(--gray6)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--gray6)]">
        <h1 className="text-lg font-semibold text-[var(--gray12)]">Settings</h1>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* System Categories */}
        <div className="mb-6">
          {systemCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                selectedCategory === category.id
                  ? "bg-[var(--gray5)] text-[var(--gray12)]"
                  : "text-[var(--gray11)] hover:bg-[var(--gray4)]"
              )}
            >
              {category.icon && <span className="text-lg">{category.icon}</span>}
              {!category.icon && getCategoryIcon(category.id)}
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Built-in Extension Categories */}
        {builtinCategories.length > 0 && (
          <div className="mb-6">
            <div className="px-3 py-2 text-xs font-semibold text-[var(--gray11)] uppercase tracking-wider">
              Built-in
            </div>
            {builtinCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                  selectedCategory === category.id
                    ? "bg-[var(--gray5)] text-[var(--gray12)]"
                    : "text-[var(--gray11)] hover:bg-[var(--gray4)]"
                )}
              >
                {category.icon && <span className="text-lg">{category.icon}</span>}
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* User-Installed Extension Categories */}
        {extensionCategories.length > 0 && (
          <div>
            <div className="px-3 py-2 text-xs font-semibold text-[var(--gray11)] uppercase tracking-wider">
              Extensions
            </div>
            {extensionCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                  selectedCategory === category.id
                    ? "bg-[var(--gray5)] text-[var(--gray12)]"
                    : "text-[var(--gray11)] hover:bg-[var(--gray4)]"
                )}
              >
                {category.icon && <span className="text-lg">{category.icon}</span>}
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getCategoryIcon(categoryId: string) {
  const icons: Record<string, string> = {
    general: "tabler:settings",
    shortcuts: "tabler:keyboard",
    advanced: "tabler:adjustments",
    about: "tabler:info-circle",
  };

  const iconName = icons[categoryId] || "tabler:puzzle";
  return <Icon icon={iconName} className="text-lg" />;
}
