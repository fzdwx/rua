import React, { useState, useRef, useEffect } from "react";
import { LeftButton, InputLoading } from "../common/tools.tsx";

export interface SearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  loading?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  inputRef?: React.Ref<HTMLInputElement | null>;
}

/**
 * Search input component with loading indicator and optional back button
 */
export function SearchInput({
  value,
  onValueChange,
  placeholder = "Search...",
  loading = false,
  showBackButton = false,
  onBack,
  inputRef: externalInputRef,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onValueChange(newValue);
  };

  // Handle backspace key to navigate back when input is empty
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && inputValue === "" && onBack) {
      const input = event.currentTarget;
      const cursorAtStart = input.selectionStart === 0 && input.selectionEnd === 0;

      if (cursorAtStart) {
        event.preventDefault();
        onBack();
      }
    }
  };

  return (
    <div className="search-input-container">
      {showBackButton && onBack && <LeftButton onClick={onBack} />}
      <input
        ref={inputRef}
        autoFocus
        className="command-input"
        autoComplete="off"
        role="combobox"
        spellCheck="false"
        value={inputValue}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <InputLoading loading={loading} />
    </div>
  );
}
