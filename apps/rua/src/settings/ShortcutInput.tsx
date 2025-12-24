/**
 * Shortcut Input Component
 *
 * Allows users to record keyboard shortcuts by pressing keys.
 * Displays the recorded shortcut in a readable format (e.g., "Ctrl+Shift+K").
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@fzdwx/ruaui";
import { ComponentsInput } from "@fzdwx/ruaui";

interface ShortcutInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Format key combination to standard shortcut format
 * e.g., ["Control", "Shift", "K"] -> "Ctrl+Shift+K"
 */
function formatShortcut(keys: string[]): string {
  if (keys.length === 0) return "";

  // Map key names to standard format
  const keyMap: Record<string, string> = {
    Control: "Ctrl",
    Meta: "Cmd",
    Alt: "Alt",
    Shift: "Shift",
  };

  const modifiers: string[] = [];
  let mainKey = "";

  for (const key of keys) {
    if (keyMap[key]) {
      modifiers.push(keyMap[key]);
    } else if (key.length === 1) {
      // Single character key (A-Z, 0-9, etc.)
      mainKey = key.toUpperCase();
    } else if (key.startsWith("Key")) {
      // KeyA -> A
      mainKey = key.substring(3);
    } else if (key.startsWith("Digit")) {
      // Digit1 -> 1
      mainKey = key.substring(5);
    } else if (key === "Space") {
      mainKey = "Space";
    } else if (key === "Escape") {
      mainKey = "Esc";
    } else if (key === "ArrowUp") {
      mainKey = "↑";
    } else if (key === "ArrowDown") {
      mainKey = "↓";
    } else if (key === "ArrowLeft") {
      mainKey = "←";
    } else if (key === "ArrowRight") {
      mainKey = "→";
    } else {
      mainKey = key;
    }
  }

  // Build shortcut string: modifiers + main key
  const parts = [...modifiers];
  if (mainKey) {
    parts.push(mainKey);
  }

  return parts.join("+");
}

export function ShortcutInput({ value, onChange, placeholder }: ShortcutInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keydown when recording
  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];

      // Record modifier keys
      if (e.ctrlKey || e.metaKey) keys.push(e.ctrlKey ? "Control" : "Meta");
      if (e.altKey) keys.push("Alt");
      if (e.shiftKey) keys.push("Shift");

      // Record main key (non-modifier)
      if (
        e.key !== "Control" &&
        e.key !== "Meta" &&
        e.key !== "Alt" &&
        e.key !== "Shift"
      ) {
        keys.push(e.code || e.key);
      }

      setRecordedKeys(keys);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // If we have recorded keys, finalize the shortcut
      if (recordedKeys.length > 0) {
        const shortcut = formatShortcut(recordedKeys);
        onChange(shortcut);
        setIsRecording(false);
        setRecordedKeys([]);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [isRecording, recordedKeys, onChange]);

  // Handle click outside to cancel recording
  useEffect(() => {
    if (!isRecording) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsRecording(false);
        setRecordedKeys([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordedKeys([]);
    inputRef.current?.focus();
  };

  const displayValue = isRecording
    ? recordedKeys.length > 0
      ? formatShortcut(recordedKeys)
      : "Press keys..."
    : value || "";

  return (
    <div className="flex gap-2">
      <ComponentsInput
        ref={inputRef}
        type="text"
        value={displayValue}
        readOnly
        placeholder={placeholder || "Click 'Record' to set shortcut"}
        className={isRecording ? "border-blue-9 bg-[var(--blue3)]" : ""}
      />
      <Button
        type="button"
        variant={isRecording ? "default" : "outline"}
        onClick={handleStartRecording}
        className="whitespace-nowrap"
      >
        {isRecording ? "Recording..." : "Record"}
      </Button>
    </div>
  );
}
