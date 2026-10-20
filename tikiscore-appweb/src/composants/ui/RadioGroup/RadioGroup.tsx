import { useId, type ChangeEvent, type InputHTMLAttributes } from "react";
import styles from "./RadioGroup.module.css";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange"> {
  label: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  orientation?: "vertical" | "horizontal";
  helperText?: string;
  error?: string;
}

export default function RadioGroup({
  id, name, label, options, value, defaultValue, onChange, orientation = "vertical",
  helperText, error, disabled, required, className = "", ...props
}: RadioGroupProps) {
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const messageId = `${groupId}-message`;

  return (
    <fieldset className={styles.fieldset} disabled={disabled} aria-describedby={error || helperText ? messageId : undefined}>
      <legend className={styles.legend}>{label}{required && <span className={styles.required}> *</span>}</legend>
      <div className={`${styles.options} ${styles[orientation]} ${className}`}>
        {options.map((option, index) => {
          const optionId = `${groupId}-${index}`;
          const optionDescriptionId = `${optionId}-description`;
          return (
            <label key={option.value} className={`${styles.option} ${option.disabled || disabled ? styles.disabled : ""}`} htmlFor={optionId}>
              <input
                {...props}
                id={optionId}
                className={styles.input}
                type="radio"
                name={name ?? groupId}
                value={option.value}
                {...(value !== undefined
                  ? { checked: value === option.value }
                  : { defaultChecked: defaultValue === option.value })}
                disabled={option.disabled || disabled}
                required={required}
                aria-invalid={error ? true : props["aria-invalid"]}
                aria-describedby={[error || helperText ? messageId : undefined, option.description ? optionDescriptionId : undefined].filter(Boolean).join(" ") || undefined}
                onChange={(event) => onChange?.(option.value, event)}
              />
              <span className={styles.indicator} aria-hidden="true" />
              <span className={styles.optionCopy}>
                <span className={styles.optionLabel}>{option.label}</span>
                {option.description && <span className={styles.description} id={optionDescriptionId}>{option.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {(error || helperText) && <span id={messageId} className={error ? styles.error : styles.helper}>{error ?? helperText}</span>}
    </fieldset>
  );
}