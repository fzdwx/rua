import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  loading?: boolean;
}

/**
 * Search input component with loading indicator
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  autoFocus = true,
  loading = false,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="search-input-container">
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
      />
      {loading && (
        <div className="search-loading-indicator">
          <div className="search-loading-bar" />
        </div>
      )}
    </div>
  );
}
