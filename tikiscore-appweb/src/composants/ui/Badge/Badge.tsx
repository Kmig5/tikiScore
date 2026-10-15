import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import styles from "./Badge.module.css";

export type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "live";

export type BadgeSize =
  | "small"
  | "medium"
  | "large";

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  rounded?: boolean;
  dot?: boolean;
}

export default function Badge({
  children,
  variant = "neutral",
  size = "medium",
  icon,
  rounded = true,
  dot = false,
  className = "",
  ...badgeProps
}: BadgeProps) {
  const badgeClassName = [
    styles.badge,
    styles[variant],
    styles[size],
    rounded ? styles.rounded : "",
    variant === "live" ? styles.liveBadge : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      {...badgeProps}
      className={badgeClassName}
    >
      {dot && (
        <span
          className={styles.dot}
          aria-hidden="true"
        />
      )}

      {icon && (
        <span
          className={styles.icon}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      <span className={styles.label}>
        {children}
      </span>
    </span>
  );
}