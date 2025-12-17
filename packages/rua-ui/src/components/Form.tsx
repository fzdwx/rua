import { createContext, useContext, useState, FormEvent } from 'react';
import { FormProps } from '../types';

interface FormContextValue {
  values: Record<string, any>;
  errors: Record<string, string>;
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: string) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

/**
 * Form component with validation and field management
 */
export function Form({ title, actions, onSubmit, children }: FormProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
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
    onSubmit?.(values);
  };

  return (
    <FormContext.Provider value={{ values, errors, setValue, setError }}>
      <form onSubmit={handleSubmit} className="form-container">
        {title && <h2 className="form-title">{title}</h2>}
        <div className="form-fields">{children}</div>
        {actions && actions.length > 0 && (
          <div className="form-actions">
            {actions.map((action) => (
              <button
                key={action.id}
                type={action.id === 'submit' ? 'submit' : 'button'}
                onClick={action.id !== 'submit' ? action.onAction : undefined}
                className="form-action-button"
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

// Form field components
interface TextFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'url';
}

Form.TextField = function TextField({
  name,
  label,
  placeholder,
  required = false,
  type = 'text',
}: TextFieldProps) {
  const { values, errors, setValue } = useFormContext();
  const value = values[name] || '';
  const error = errors[name];

  return (
    <div className="form-field">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => setValue(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`form-input ${error ? 'form-input-error' : ''}`}
      />
      {error && <span className="form-error-message">{error}</span>}
    </div>
  );
};

interface TextAreaProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

Form.TextArea = function TextArea({
  name,
  label,
  placeholder,
  required = false,
  rows = 4,
}: TextAreaProps) {
  const { values, errors, setValue } = useFormContext();
  const value = values[name] || '';
  const error = errors[name];

  return (
    <div className="form-field">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => setValue(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`form-textarea ${error ? 'form-input-error' : ''}`}
      />
      {error && <span className="form-error-message">{error}</span>}
    </div>
  );
};

interface DropdownProps {
  name: string;
  label: string;
  items: Array<{ label: string; value: string }>;
  required?: boolean;
}

Form.Dropdown = function Dropdown({ name, label, items, required = false }: DropdownProps) {
  const { values, errors, setValue } = useFormContext();
  const value = values[name] || '';
  const error = errors[name];

  return (
    <div className="form-field">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => setValue(name, e.target.value)}
        required={required}
        className={`form-select ${error ? 'form-input-error' : ''}`}
      >
        <option value="">Select an option</option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error-message">{error}</span>}
    </div>
  );
};

interface CheckboxProps {
  name: string;
  label: string;
}

Form.Checkbox = function Checkbox({ name, label }: CheckboxProps) {
  const { values, setValue } = useFormContext();
  const checked = values[name] || false;

  return (
    <div className="form-field form-field-checkbox">
      <label htmlFor={name} className="form-checkbox-label">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => setValue(name, e.target.checked)}
          className="form-checkbox"
        />
        <span>{label}</span>
      </label>
    </div>
  );
};
