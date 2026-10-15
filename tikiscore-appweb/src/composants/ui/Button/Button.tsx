import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import styles from "./Button.module.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

export type ButtonSize =
  | "small"
  | "medium"
  | "large";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  isLoading = false,
  loadingText = "Chargement...",
  disabled = false,
  type = "button",
  className = "",
  ...buttonProps
}: ButtonProps) {
  const buttonClassName = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...buttonProps}
      type={type}
      className={buttonClassName}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {isLoading && (
        <span
          className={styles.spinner}
          aria-hidden="true"
        />
      )}

      <span className={styles.label}>
        {isLoading ? loadingText : children}
      </span>
    </button>
  );
}