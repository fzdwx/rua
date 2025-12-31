/**
 * Preference Form Field
 *
 * Dynamic form field component that renders different input types
 * based on the preference field definition
 */

import { ComponentsInput } from "@fzdwx/ruaui";
import { Label } from "@fzdwx/ruaui";
import { Switch } from "@fzdwx/ruaui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@fzdwx/ruaui";
import { ShortcutInput } from "./ShortcutInput";
import { PathListInput } from "./PathListInput";
import type { PreferenceField, PreferenceOption } from "rua-api";

interface PreferenceFormFieldProps {
  preference: PreferenceField;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function PreferenceFormField({ preference, value, onChange }: PreferenceFormFieldProps) {
  const currentValue = value ?? preference.default;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={preference.name} className="text-sm font-medium text-[var(--gray12)]">
            {preference.title}
            {preference.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {preference.description && (
            <p className="text-sm text-[var(--gray11)]">{preference.description}</p>
          )}
        </div>

        {preference.type === "toggle" && (
          <Switch
            id={preference.name}
            checked={currentValue as boolean}
            onCheckedChange={onChange}
          />
        )}
      </div>

      {preference.type === "textfield" && (
        <ComponentsInput
          id={preference.name}
          type="text"
          value={(currentValue as string) || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={preference.placeholder}
          className="bg-[var(--gray3)] border-[var(--gray6)] hover:bg-[var(--gray4)] focus:ring-2 focus:ring-ring"
        />
      )}

      {preference.type === "dropdown" && (
        <Select value={(currentValue as string) || ""} onValueChange={onChange}>
          <SelectTrigger
            id={preference.name}
            className="bg-[var(--gray3)] border-[var(--gray6)] hover:bg-[var(--gray4)]"
          >
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--gray3)] border-[var(--gray6)] backdrop-blur-md">
            {preference.options?.map((option: PreferenceOption) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {preference.type === "number" && (
        <div className="flex items-center gap-2">
          <ComponentsInput
            id={preference.name}
            type="number"
            min={(preference as any).min ?? undefined}
            max={(preference as any).max ?? undefined}
            step={(preference as any).step ?? 1}
            value={(currentValue as number) ?? (preference as any).default ?? 0}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const inputValue = e.target.value;

              // Handle empty input
              if (inputValue === "" || inputValue === "-") {
                return;
              }

              // Parse and normalize the number (removes leading zeros)
              const numValue = Number(inputValue);
              const min = (preference as any).min;
              const max = (preference as any).max;

              // Validate range
              if (!isNaN(numValue)) {
                if (min !== undefined && numValue < min) {
                  onChange(min);
                } else if (max !== undefined && numValue > max) {
                  onChange(max);
                } else {
                  onChange(numValue); // This removes leading zeros automatically
                }
              }
            }}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              // Ensure value is within range on blur
              const inputValue = e.target.value;
              const numValue = Number(inputValue);
              const min = (preference as any).min ?? 0;
              const max = (preference as any).max;

              if (inputValue === "" || isNaN(numValue) || numValue < min) {
                onChange(min);
              } else if (max !== undefined && numValue > max) {
                onChange(max);
              } else {
                // Normalize the value (remove leading zeros)
                onChange(numValue);
              }
            }}
            inputMode="decimal"
            autoComplete="off"
            className="flex-1 bg-[var(--gray3)] border-[var(--gray6)] hover:bg-[var(--gray4)] focus:ring-2 focus:ring-ring"
          />
          {((preference as any).min !== undefined || (preference as any).max !== undefined) && (
            <span className="text-xs text-[var(--gray10)] whitespace-nowrap">
              {(preference as any).min !== undefined && (preference as any).max !== undefined
                ? `(${(preference as any).min}-${(preference as any).max})`
                : (preference as any).min !== undefined
                ? `(min: ${(preference as any).min})`
                : `(max: ${(preference as any).max})`}
            </span>
          )}
        </div>
      )}

      {preference.type === "open" && (
        <div className="space-y-3">
          <Select
            value={(currentValue as any)?.method || ""}
            onValueChange={(val) => onChange({ ...currentValue, method: val })}
          >
            <SelectTrigger
              className="bg-[var(--gray3)] border-[var(--gray6)] hover:bg-[var(--gray4)]"
            >
              <SelectValue placeholder="Select open method" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--gray3)] border-[var(--gray6)] backdrop-blur-md">
              {(preference as any).options?.map((option: PreferenceOption) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ComponentsInput
            type="text"
            value={(currentValue as any)?.paths?.join(",") || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const paths = e.target.value.split(",").map(p => p.trim()).filter(p => p);
              onChange({ ...currentValue, paths });
            }}
            placeholder="Comma-separated paths (e.g., /path/one,/path/two)"
            className="bg-[var(--gray3)] border-[var(--gray6)] hover:bg-[var(--gray4)] focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {preference.type === "pathlist" && (
        <PathListInput
          value={(currentValue as string[]) ?? []}
          onChange={onChange}
          placeholder={(preference as any).placeholder}
          validatePaths={(preference as any).validatePaths}
        />
      )}

      {preference.type === "shortcut" && (
        <ShortcutInput
          value={(currentValue as string) || ""}
          onChange={(value) => onChange(value)}
          placeholder={preference.placeholder}
        />
      )}
    </div>
  );
}
