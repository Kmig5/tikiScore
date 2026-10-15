import {
  forwardRef,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
} from "lucide-react";

import Input, {
  type InputProps,
} from "../Input";

import styles from "./InputPassword.module.css";

export interface InputPasswordProps
  extends Omit<InputProps, "type" | "rightElement"> {
  initiallyVisible?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

const InputPassword = forwardRef<
  HTMLInputElement,
  InputPasswordProps
>(function InputPassword(
  {
    initiallyVisible = false,
    showPasswordLabel = "Afficher le mot de passe",
    hidePasswordLabel = "Masquer le mot de passe",
    autoComplete = "current-password",
    disabled = false,
    readOnly = false,
    ...inputProps
  },
  ref
) {
  const [isPasswordVisible, setIsPasswordVisible] =
    useState(initiallyVisible);

  const visibilityLabel = isPasswordVisible
    ? hidePasswordLabel
    : showPasswordLabel;

  function togglePasswordVisibility() {
    setIsPasswordVisible((currentValue) => !currentValue);
  }

  return (
    <Input
      {...inputProps}
      ref={ref}
      type={isPasswordVisible ? "text" : "password"}
      autoComplete={autoComplete}
      disabled={disabled}
      readOnly={readOnly}
      rightElement={
        <button
          type="button"
          className={styles.visibilityButton}
          onClick={togglePasswordVisibility}
          disabled={disabled}
          aria-label={visibilityLabel}
          title={visibilityLabel}
        >
          {isPasswordVisible ? (
            <EyeOff
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          ) : (
            <Eye
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          )}
        </button>
      }
    />
  );
});

InputPassword.displayName = "InputPassword";

export default InputPassword;