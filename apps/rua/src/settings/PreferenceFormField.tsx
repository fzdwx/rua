/**
 * Preference Form Field
 *
 * Dynamic form field component that renders different input types
 * based on the preference field definition
 */

import {ComponentsInput} from "@fzdwx/ruaui";
import {Label} from "@fzdwx/ruaui";
import {Switch} from "@fzdwx/ruaui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fzdwx/ruaui";
import {ShortcutInput} from "./ShortcutInput";
import type {PreferenceField, PreferenceOption} from "rua-api";

interface PreferenceFormFieldProps {
  preference: PreferenceField;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function PreferenceFormField({preference, value, onChange}: PreferenceFormFieldProps) {
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
        <Select
          value={(currentValue as string) || ""}
          onValueChange={onChange}
        >
          <SelectTrigger
            id={preference.name}
            className="bg-[var(--gray3)] border-[var(--gray6)] hover:bg-[var(--gray4)]"
          >
            <SelectValue placeholder="Select an option"/>
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
