import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  Info,
  X,
} from "lucide-react";

import styles from "./Alert.module.css";

export type AlertVariant =
  | "success"
  | "error"
  | "warning"
  | "info";

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  icon?: ReactNode;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

function getDefaultIcon(
  variant: AlertVariant
): ReactNode {
  const iconProps = {
    size: 21,
    strokeWidth: 2,
    "aria-hidden": true,
  };

  switch (variant) {
    case "success":
      return <CheckCircle2 {...iconProps} />;

    case "error":
      return <CircleX {...iconProps} />;

    case "warning":
      return <CircleAlert {...iconProps} />;

    case "info":
    default:
      return <Info {...iconProps} />;
  }
}

export default function Alert({
  children,
  variant = "info",
  title,
  icon,
  showIcon = true,
  dismissible = false,
  onDismiss,
  className = "",
  role,
  ...alertProps
}: AlertProps) {
  const alertClassName = [
    styles.alert,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const alertRole =
    role ?? (variant === "error" ? "alert" : "status");

  const displayedIcon =
    icon ?? getDefaultIcon(variant);

  function handleDismiss() {
    onDismiss?.();
  }

  return (
    <div
      {...alertProps}
      className={alertClassName}
      role={alertRole}
      aria-live={
        variant === "error"
          ? "assertive"
          : "polite"
      }
    >
      {showIcon && (
        <span
          className={styles.icon}
          aria-hidden="true"
        >
          {displayedIcon}
        </span>
      )}

      <div className={styles.content}>
        {title && (
          <p className={styles.title}>
            {title}
          </p>
        )}

        <div className={styles.message}>
          {children}
        </div>
      </div>

      {dismissible && (
        <button
          type="button"
          className={styles.dismissButton}
          onClick={handleDismiss}
          aria-label="Fermer le message"
          title="Fermer"
        >
          <X
            size={18}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}