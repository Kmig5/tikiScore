import { useId, useState, type ButtonHTMLAttributes } from "react";
import styles from "./Switch.module.css";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  label: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function Switch({
  id, label, description, checked, defaultChecked = false, onChange, disabled, className = "", ...props
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = checked ?? internalChecked;

  function handleClick() {
    if (checked === undefined) setInternalChecked(!internalChecked);
    onChange?.(!isChecked);
  }

  return (
    <button
      {...props}
      id={switchId}
      type="button"
      role="switch"
      aria-checked={isChecked}
      aria-label={label}
      aria-describedby={description ? `${switchId}-description` : undefined}
      disabled={disabled}
      className={`${styles.switch} ${isChecked ? styles.checked : ""} ${disabled ? styles.disabled : ""} ${className}`}
      onClick={handleClick}
    >
      <span className={styles.copy}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.description} id={`${switchId}-description`}>{description}</span>}
      </span>
      <span className={styles.track} aria-hidden="true"><span className={styles.thumb} /></span>
    </button>
  );
}