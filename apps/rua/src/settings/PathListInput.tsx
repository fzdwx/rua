/**
 * PathListInput Component
 *
 * Manages an array of directory paths with validation and file picker support
 */

import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
import { ComponentsInput } from "@fzdwx/ruaui";
import { X, FolderOpen, Plus } from "lucide-react";

interface PathListInputProps {
  value: string[];
  onChange: (paths: string[]) => void;
  placeholder?: string;
  validatePaths?: boolean;
}

export function PathListInput({
  value,
  onChange,
  placeholder = "Enter directory path",
  validatePaths = true,
}: PathListInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validatePath = async (path: string): Promise<boolean> => {
    if (!validatePaths) return true;

    try {
      const results = await invoke<boolean[]>("validate_search_paths", {
        paths: [path],
      });
      return results[0] ?? false;
    } catch (err) {
      console.error("Path validation error:", err);
      return false;
    }
  };

  const handleAddPath = async (path: string) => {
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      setError("Path cannot be empty");
      return;
    }

    // Check for duplicates
    if (value.includes(trimmedPath)) {
      setError("Path already exists in the list");
      return;
    }

    // Validate path exists
    setIsValidating(true);
    setError(null);

    const isValid = await validatePath(trimmedPath);

    setIsValidating(false);

    if (!isValid) {
      setError(`Directory does not exist: ${trimmedPath}`);
      return;
    }

    // Add path to list
    onChange([...value, trimmedPath]);
    setInputValue("");
    setError(null);
  };

  const handleRemovePath = (index: number) => {
    const newPaths = [...value];
    newPaths.splice(index, 1);
    onChange(newPaths);
  };

  const handleBrowse = async () => {
    try {
      // Get current window context - required for Tauri dialog plugin
      getCurrentWebviewWindow();

      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === "string") {
        await handleAddPath(selected);
      }
    } catch (err) {
      console.error("File picker error:", err);
      setError("Failed to open file picker");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPath(inputValue);
    }
  };

  return (
    <div className="space-y-3">
      {/* Input area */}
      <div className="flex gap-2">
        <ComponentsInput
          type="text"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isValidating}
          className="flex-1 bg-(--gray3) border-(--gray6) hover:bg-(--gray4) focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => handleAddPath(inputValue)}
          disabled={!inputValue.trim() || isValidating}
          className="px-3 py-2 text-sm bg-(--gray3) border border-(--gray6) hover:bg-(--gray4) text-(--gray12) rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
        <button
          type="button"
          onClick={handleBrowse}
          disabled={isValidating}
          className="px-3 py-2 text-sm bg-(--gray3) border border-(--gray6) hover:bg-(--gray4) text-(--gray12) rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FolderOpen className="h-4 w-4" />
          Browse
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-500 dark:text-red-400">{error}</div>
      )}

      {/* Validation indicator */}
      {isValidating && (
        <div className="text-sm text-(--gray11)">Validating path...</div>
      )}

      {/* Path list */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-(--gray11)">
            {value.length} {value.length === 1 ? "path" : "paths"} added:
          </div>
          <div className="space-y-1">
            {value.map((path, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded bg-(--gray3) border border-(--gray6) text-sm"
              >
                <FolderOpen className="h-4 w-4 text-(--gray10) flex-shrink-0" />
                <span className="flex-1 text-(--gray12) break-all">
                  {path}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePath(index)}
                  className="text-[var(--gray11)] hover:text-[var(--gray12)] transition-colors flex-shrink-0"
                  aria-label={`Remove ${path}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {value.length === 0 && (
        <div className="text-sm text-[var(--gray10)] italic">
          No custom paths configured. Add directories to search in addition to
          your home directory.
        </div>
      )}
    </div>
  );
}
