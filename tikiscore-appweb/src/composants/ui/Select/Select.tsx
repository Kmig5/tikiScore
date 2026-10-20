import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./Select.module.css";

export type SelectSize = "small" | "medium" | "large";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  size?: SelectSize;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    id,
    label,
    options,
    placeholder = "Sélectionner...",
    helperText,
    error,
    size = "medium",
    fullWidth = true,
    className = "",
    required,
    disabled,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;
  const describedBy = [props["aria-describedby"], error || helperText ? messageId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={`${styles.field} ${fullWidth ? styles.fullWidth : ""}`}>
      <label className={styles.label} htmlFor={selectId}>
        {label}{required && <span className={styles.required}> *</span>}
      </label>
      <div className={`${styles.control} ${styles[size]} ${error ? styles.hasError : ""} ${disabled ? styles.disabled : ""}`}>
        <select
          {...props}
          ref={ref}
          id={selectId}
          className={`${styles.select} ${className}`}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={describedBy}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className={styles.icon} size={18} aria-hidden="true" />
      </div>
      {(error || helperText) && (
        <span id={messageId} className={error ? styles.error : styles.helper}>
          {error ?? helperText}
        </span>
      )}
    </div>
  );
});

export default Select;