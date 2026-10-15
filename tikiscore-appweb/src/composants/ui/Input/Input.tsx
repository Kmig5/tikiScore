import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import styles from "./Input.module.css";

export type InputSize =
  | "small"
  | "medium"
  | "large";

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  inputSize?: InputSize;
  fullWidth?: boolean;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      helperText,
      error,
      inputSize = "medium",
      fullWidth = true,
      leftElement,
      rightElement,
      containerClassName = "",
      className = "",
      required = false,
      disabled = false,
      readOnly = false,
      id,
      type = "text",
      ...inputProps
    },
    ref
  ) {
    const generatedId = useId();

    const inputId = id ?? `input-${generatedId}`;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const describedBy = error
      ? errorId
      : helperText
        ? helperId
        : undefined;

    const containerClasses = [
      styles.container,
      fullWidth ? styles.fullWidth : "",
      disabled ? styles.disabled : "",
      readOnly ? styles.readOnly : "",
      containerClassName,
    ]
      .filter(Boolean)
      .join(" ");

    const inputWrapperClasses = [
      styles.inputWrapper,
      styles[inputSize],
      error ? styles.hasError : "",
      disabled ? styles.wrapperDisabled : "",
      readOnly ? styles.wrapperReadOnly : "",
    ]
      .filter(Boolean)
      .join(" ");

    const inputClasses = [
      styles.input,
      leftElement ? styles.hasLeftElement : "",
      rightElement ? styles.hasRightElement : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={containerClasses}>
        {label && (
          <label
            className={styles.label}
            htmlFor={inputId}
          >
            <span>{label}</span>

            {required && (
              <span
                className={styles.required}
                aria-hidden="true"
              >
                *
              </span>
            )}
          </label>
        )}

        <div className={inputWrapperClasses}>
          {leftElement && (
            <span
              className={styles.leftElement}
              aria-hidden="true"
            >
              {leftElement}
            </span>
          )}

          <input
            {...inputProps}
            ref={ref}
            id={inputId}
            type={type}
            className={inputClasses}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          />

          {rightElement && (
            <span className={styles.rightElement}>
              {rightElement}
            </span>
          )}
        </div>

        {error ? (
          <p
            id={errorId}
            className={styles.errorMessage}
            role="alert"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className={styles.helperText}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

export default Input;