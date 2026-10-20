import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, description, error, className = "", required, ...props },
  ref,
) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  const messageId = `${checkboxId}-message`;
  const describedBy = [props["aria-describedby"], description ? messageId : undefined, error ? (description ? `${messageId}-error` : messageId) : undefined]
    .filter(Boolean).join(" ") || undefined;

  return (
    <div className={`${styles.field} ${props.disabled ? styles.disabled : ""}`}>
      <label className={styles.label} htmlFor={checkboxId}>
        <span className={styles.box}>
          <input
            {...props}
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={`${styles.input} ${className}`}
            required={required}
            aria-invalid={error ? true : props["aria-invalid"]}
            aria-describedby={describedBy}
          />
          <Check className={styles.check} size={15} strokeWidth={3} aria-hidden="true" />
        </span>
        <span className={styles.copy}>
          <span className={styles.labelText}>{label}{required && <span className={styles.required}> *</span>}</span>
          {description && <span className={styles.description} id={messageId}>{description}</span>}
        </span>
      </label>
      {error && <span className={styles.error} id={description ? `${messageId}-error` : messageId}>{error}</span>}
    </div>
  );
});

export default Checkbox;