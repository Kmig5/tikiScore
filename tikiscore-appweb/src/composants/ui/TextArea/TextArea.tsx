import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from "react";

import styles from "./TextArea.module.css";

export type TextAreaSize =
  | "small"
  | "medium"
  | "large";

export type TextAreaResize =
  | "none"
  | "vertical"
  | "horizontal"
  | "both";

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  textAreaSize?: TextAreaSize;
  resize?: TextAreaResize;
  fullWidth?: boolean;
  showCharacterCount?: boolean;
  containerClassName?: string;
}

const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextAreaProps
>(function TextArea(
  {
    label,
    helperText,
    error,
    textAreaSize = "medium",
    resize = "vertical",
    fullWidth = true,
    showCharacterCount = false,
    containerClassName = "",
    className = "",
    required = false,
    disabled = false,
    readOnly = false,
    id,
    rows = 4,
    value,
    defaultValue,
    maxLength,
    onChange,
    ...textAreaProps
  },
  ref
) {
  const generatedId = useId();

  const textAreaId =
    id ?? `textarea-${generatedId}`;

  const helperId =
    `${textAreaId}-helper`;

  const errorId =
    `${textAreaId}-error`;

  const counterId =
    `${textAreaId}-counter`;

  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] =
    useState(() => String(defaultValue ?? ""));

  const currentValue = isControlled
    ? String(value ?? "")
    : internalValue;

  const currentLength = currentValue.length;

  const descriptionIds = [
    error
      ? errorId
      : helperText
        ? helperId
        : "",
    showCharacterCount
      ? counterId
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const containerClasses = [
    styles.container,
    fullWidth ? styles.fullWidth : "",
    disabled ? styles.disabled : "",
    readOnly ? styles.readOnly : "",
    containerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const textAreaClasses = [
    styles.textArea,
    styles[textAreaSize],
    styles[`resize-${resize}`],
    error ? styles.hasError : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  function handleChange(
    event: ChangeEvent<HTMLTextAreaElement>
  ) {
    if (!isControlled) {
      setInternalValue(event.target.value);
    }

    onChange?.(event);
  }

  return (
    <div className={containerClasses}>
      {label && (
        <label
          className={styles.label}
          htmlFor={textAreaId}
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

      <textarea
        {...textAreaProps}
        ref={ref}
        id={textAreaId}
        className={textAreaClasses}
        rows={rows}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={
          descriptionIds || undefined
        }
        value={
          isControlled
            ? value
            : undefined
        }
        defaultValue={
          isControlled
            ? undefined
            : defaultValue
        }
        onChange={handleChange}
      />

      <div className={styles.footer}>
        <div className={styles.messageContainer}>
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

        {showCharacterCount && (
          <span
            id={counterId}
            className={[
              styles.characterCount,
              maxLength !== undefined &&
              currentLength >= maxLength
                ? styles.limitReached
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-live="polite"
          >
            {currentLength}

            {maxLength !== undefined
              ? ` / ${maxLength}`
              : ""}
          </span>
        )}
      </div>
    </div>
  );
});

TextArea.displayName = "TextArea";

export default TextArea