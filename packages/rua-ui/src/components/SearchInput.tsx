import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
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
  onChange,
  placeholder = 'Search...',
  autoFocus = true,
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
    onChange(newValue);
  };

  // Handle backspace key to navigate back when input is empty
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && inputValue === '' && onBack) {
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
      {showBackButton && onBack && (
        <button
          className="search-input-back-button"
          onClick={onBack}
          title="Back"
          type="button"
        >
          <svg
            className="search-input-back-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        className="search-input"
        autoComplete="off"
        role="combobox"
        spellCheck="false"
        value={inputValue}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {loading && (
        <div className="search-loading-indicator">
          <div className="search-loading-bar" />
        </div>
      )}
    </div>
  );
}
