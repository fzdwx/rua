import { createContext, useContext, useState, FormEvent, useEffect, useRef, ReactElement } from 'react';
import { FormProps } from '../types';
import type { 
  FormTextFieldProps, 
  FormTextAreaProps, 
  FormPasswordFieldProps,
  FormDropdownProps,
  FormDropdownItemProps,
  FormDropdownSectionProps,
  FormDatePickerProps,
  FormFilePickerProps,
  FormCheckboxProps,
} from '../types';

interface FormContextValue {
  values: Record<string, any>;
  errors: Record<string, string>;
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: string) => void;
  isLoading: boolean;
}

const FormContext = createContext<FormContextValue | null>(null);

const DRAFT_STORAGE_KEY = 'rua-form-drafts';

/**
 * Hook to access form context
 */
export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('Form fields must be used within a Form component');
  }
  return context;
}

/**
 * TextField component with Raycast-aligned API
 */
function TextField({
  id,
  title,
  placeholder,
  defaultValue,
  value: controlledValue,
  error: propError,
  info,
  onChange,
  onBlur,
  autoFocus = false,
}: FormTextFieldProps) {
  const { values, errors, setValue, isLoading } = useFormContext();
  
  const isControlled = controlledValue !== undefined;
  const internalValue = values[id] ?? defaultValue ?? '';
  const displayValue = isControlled ? controlledValue : internalValue;
  const error = propError || errors[id];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setValue(id, newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="form-field">
      {title && (
        <label htmlFor={id} className="form-label">
          {title}
        </label>
      )}
      <input
        id={id}
        name={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={isLoading}
        className={`form-input ${error ? 'form-input-error' : ''}`}
      />
      {info && !error && <span className="form-info-message">{info}</span>}
      {error && <span className="form-error-message">{error}</span>}
    </div>
  );
}

/**
 * TextArea component with Raycast-aligned API
 */
function TextArea({
  id,
  title,
  placeholder,
  defaultValue,
  value: controlledValue,
  error: propError,
  info,
  onChange,
  onBlur,
  autoFocus = false,
  rows = 4,
  enableMarkdownPreview = false,
}: FormTextAreaProps) {
  const { values, errors, setValue, isLoading } = useFormContext();
  const [showPreview, setShowPreview] = useState(false);
  
  const isControlled = controlledValue !== undefined;
  const internalValue = values[id] ?? defaultValue ?? '';
  const displayValue = isControlled ? controlledValue : internalValue;
  const error = propError || errors[id];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setValue(id, newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="form-field">
      {title && (
        <div className="form-label-row">
          <label htmlFor={id} className="form-label">
            {title}
          </label>
          {enableMarkdownPreview && (
            <button
              type="button"
              className="form-preview-toggle"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          )}
        </div>
      )}
      {enableMarkdownPreview && showPreview ? (
        <div className="form-markdown-preview">
          {displayValue || <span className="form-preview-empty">Nothing to preview</span>}
        </div>
      ) : (
        <textarea
          id={id}
          name={id}
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isLoading}
          rows={rows}
          className={`form-textarea ${error ? 'form-input-error' : ''}`}
        />
      )}
      {info && !error && <span className="form-info-message">{info}</span>}
      {error && <span className="form-error-message">{error}</span>}
    </div>
  );
}

/**
 * Dropdown.Item component
 */
function DropdownItem({ value, title }: FormDropdownItemProps): ReactElement {
  return (
    <option value={value}>
      {title}
    </option>
  );
}

/**
 * Dropdown.Section component
 */
function DropdownSection({ title, children }: FormDropdownSectionProps): ReactElement {
  return (
    <optgroup label={title || ''}>
      {children}
    </optgroup>
  );
}

/**
 * Dropdown component with Raycast-aligned API
 */
function Dropdown({ 
  id, 
  title, 
  value: controlledValue,
  defaultValue,
  onChange,
  error: propError,
  info,
  children,
  items,
}: FormDropdownProps) {
  const { values, errors, setValue, isLoading } = useFormContext();
  
  const isControlled = controlledValue !== undefined;
  const internalValue = values[id] ?? defaultValue ?? '';
  const displayValue = isControlled ? controlledValue : internalValue;
  const error = propError || errors[id];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setValue(id, newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="form-field">
      {title && (
        <label htmlFor={id} className="form-label">
          {title}
        </label>
      )}
      <select
        id={id}
        name={id}
        value={displayValue}
        onChange={handleChange}
        disabled={isLoading}
        className={`form-select ${error ? 'form-input-error' : ''}`}
      >
        <option value="">Select an option</option>
        {items?.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
        {children}
      </select>
      {info && !error && <span className="form-info-message">{info}</span>}
      {error && <span className="form-error-message">{error}</span>}
    </div>
  );
}

// Attach sub-components to Dropdown
const DropdownWithSubs = Object.assign(Dropdown, {
  Item: DropdownItem,
  Section: DropdownSection,
});

/**
 * Checkbox component with Raycast-aligned API
 */
function Checkbox({ 
  id, 
  label,
  value: controlledValue,
  defaultValue,
  onChange,
  info,
}: FormCheckboxProps) {
  const { values, setValue, isLoading } = useFormContext();
  
  const isControlled = controlledValue !== undefined;
  const internalValue = values[id] ?? defaultValue ?? false;
  const checked = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    if (!isControlled) {
      setValue(id, newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="form-field form-field-checkbox">
      <label htmlFor={id} className="form-checkbox-label">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={isLoading}
          className="form-checkbox"
        />
        <span>{label}</span>
      </label>
      {info && <span className="form-info-message">{info}</span>}
    </div>
  );
}

/**
 * PasswordField component with Raycast-aligned API
 */
function PasswordField({
  id,
  title,
  placeholder,
  defaultValue,
  value: controlledValue,
  error: propError,
  info,
  onChange,
  onBlur,
  autoFocus = false,
}: FormPasswordFieldProps) {
  const { values, errors, setValue, isLoading } = useFormContext();
  
  const isControlled = controlledValue !== undefined;
  const internalValue = values[id] ?? defaultValue ?? '';
  const displayValue = isControlled ? controlledValue : internalValue;
  const error = propError || errors[id];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setValue(id, newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="form-field">
      {title && (
        <label htmlFor={id} className="form-label">
          {title}
        </label>
      )}
      <input
        id={id}
        name={id}
        type="password"
        value={displayValue}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={isLoading}
        autoComplete="current-password"
        className={`form-input ${error ? 'form-input-error' : ''}`}
      />
      {info && !error && <span className="form-info-message">{info}</span>}
      {error && <span className="form-error-message">{error}</span>}
    </div>
  );
}

/**
 * DatePicker component with Raycast-aligned API
 */
function DatePicker({
  id,
  title,
  value: controlledValue,
  defaultValue,
  min,
  max,
  type = 'date',
  onChange,
  error: propError,
  info,
}: FormDatePickerProps) {
  const { values, errors, setValue, isLoading } = useFormContext();
  
  const isControlled = controlledValue !== undefined;
  const internalValue = values[id] ?? defaultValue;
  const dateValue = isControlled ? controlledValue : internalValue;
  const error = propError || errors[id];

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    if (type === 'datetime') {
      return date.toISOString().slice(0, 16);
    }
    return date.toISOString().slice(0, 10);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value ? new Date(e.target.value) : null;
    if (!isControlled) {
      setValue(id, newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="form-field">
      {title && (
        <label htmlFor={id} className="form-label">
          {title}
        </label>
      )}
      <input
        id={id}
        name={id}
        type={type === 'datetime' ? 'datetime-local' : 'date'}
        value={formatDateForInput(dateValue)}
        onChange={handleChange}
        min={min ? formatDateForInput(min) : undefined}
        max={max ? formatDateForInput(max) : undefined}
        disabled={isLoading}
        className={`form-input ${error ? 'form-input-error' : ''}`}
      />
      {info && !error && <span className="form-info-message">{info}</span>}
      {error && <span className="form-error-message">{error}</span>}
    </div>
  );
}

/**
 * FilePicker component with Raycast-aligned API
 */
function FilePicker({
  id,
  title,
  allowMultipleSelection = false,
  canChooseDirectories = false,
  canChooseFiles = true,
  allowedFileTypes,
  value: controlledValue,
  defaultValue,
  onChange,
  error: propError,
  info,
}: FormFilePickerProps) {
  const { values, errors, setValue, isLoading } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isControlled = controlledValue !== undefined;
  const internalValue: string[] = values[id] ?? defaultValue ?? [];
  const files: string[] = isControlled ? (controlledValue ?? []) : internalValue;
  const error = propError || errors[id];

  const acceptString = allowedFileTypes?.map(type => 
    type.startsWith('.') ? type : `.${type}`
  ).join(',');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    const filePaths = Array.from(selectedFiles).map((file: File) => file.name);
    if (!isControlled) {
      setValue(id, filePaths);
    }
    onChange?.(filePaths);
  };

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!isControlled) {
      setValue(id, []);
    }
    onChange?.([]);
  };

  return (
    <div className="form-field">
      {title && (
        <label htmlFor={id} className="form-label">
          {title}
        </label>
      )}
      <div className="form-file-picker">
        <input
          ref={fileInputRef}
          id={id}
          name={id}
          type="file"
          multiple={allowMultipleSelection}
          accept={acceptString}
          onChange={handleChange}
          disabled={isLoading}
          className="form-file-input"
          {...(canChooseDirectories && !canChooseFiles ? { webkitdirectory: '' } : {})}
        />
        {files.length > 0 && (
          <div className="form-file-list">
            {files.map((file: string, index: number) => (
              <span key={index} className="form-file-item">
                {file}
              </span>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="form-file-clear"
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      {info && !error && <span className="form-info-message">{info}</span>}
      {error && <span className="form-error-message">{error}</span>}
    </div>
  );
}

/**
 * Form component with validation and field management
 */
function FormComponent({ 
  title, 
  actions, 
  onSubmit, 
  children,
  navigationTitle,
  isLoading = false,
  enableDrafts = false,
}: FormProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formId = useRef(`form-${Date.now()}`);

  useEffect(() => {
    if (enableDrafts) {
      try {
        const drafts = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (drafts) {
          const parsed = JSON.parse(drafts);
          if (parsed[formId.current]) {
            setValues(parsed[formId.current]);
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [enableDrafts]);

  useEffect(() => {
    if (enableDrafts && Object.keys(values).length > 0) {
      try {
        const drafts = localStorage.getItem(DRAFT_STORAGE_KEY);
        const parsed = drafts ? JSON.parse(drafts) : {};
        parsed[formId.current] = values;
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [values, enableDrafts]);

  const setValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const setError = (name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (enableDrafts) {
      try {
        const drafts = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (drafts) {
          const parsed = JSON.parse(drafts);
          delete parsed[formId.current];
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    onSubmit?.(values);
  };

  const displayTitle = navigationTitle || title;

  return (
    <FormContext.Provider value={{ values, errors, setValue, setError, isLoading }}>
      <form onSubmit={handleSubmit} className="form-container">
        {displayTitle && <h2 className="form-title">{displayTitle}</h2>}
        {isLoading && (
          <div className="form-loading">
            <div className="form-loading-spinner" />
          </div>
        )}
        <div className={`form-fields ${isLoading ? 'form-fields-loading' : ''}`}>
          {children}
        </div>
        {actions && actions.length > 0 && (
          <div className="form-actions">
            {actions.map((action) => (
              <button
                key={action.id}
                type={action.id === 'submit' ? 'submit' : 'button'}
                onClick={action.id !== 'submit' ? action.onAction : undefined}
                className="form-action-button"
                disabled={isLoading}
              >
                {action.icon && <span className="action-icon">{action.icon}</span>}
                {action.title}
              </button>
            ))}
          </div>
        )}
      </form>
    </FormContext.Provider>
  );
}

// Create Form with all sub-components attached
export const Form = Object.assign(FormComponent, {
  TextField,
  TextArea,
  Dropdown: DropdownWithSubs,
  Checkbox,
  PasswordField,
  DatePicker,
  FilePicker,
});
