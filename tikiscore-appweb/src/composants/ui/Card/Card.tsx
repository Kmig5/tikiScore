import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import styles from "./Card.module.css";

export type CardVariant =
  | "default"
  | "outlined"
  | "elevated"
  | "ghost";

export type CardPadding =
  | "none"
  | "small"
  | "medium"
  | "large";

export interface CardProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  fullWidth?: boolean;
  interactive?: boolean;
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
}

export default function Card({
  children,
  variant = "default",
  padding = "medium",
  fullWidth = false,
  interactive = false,
  icon,
  title,
  subtitle,
  headerAction,
  footer,
  className = "",
  onClick,
  onKeyDown,
  tabIndex,
  role,
  ...cardProps
}: CardProps) {
  const isInteractive = interactive || Boolean(onClick);

  const cardClassName = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    fullWidth ? styles.fullWidth : "",
    isInteractive ? styles.interactive : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>
  ) {
    onKeyDown?.(event);

    if (
      !event.defaultPrevented &&
      onClick &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      event.currentTarget.click();
    }
  }

  const hasHeader =
    Boolean(icon) ||
    Boolean(title) ||
    Boolean(subtitle) ||
    Boolean(headerAction);

  return (
    <div
      {...cardProps}
      className={cardClassName}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? handleKeyDown
          : onKeyDown
      }
      tabIndex={
        isInteractive
          ? (tabIndex ?? 0)
          : tabIndex
      }
      role={
        isInteractive
          ? (role ?? "button")
          : role
      }
    >
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.headerContent}>
            {icon && (
              <span
                className={styles.icon}
                aria-hidden="true"
              >
                {icon}
              </span>
            )}

            {(title || subtitle) && (
              <div className={styles.heading}>
                {title && (
                  <h3 className={styles.title}>
                    {title}
                  </h3>
                )}

                {subtitle && (
                  <p className={styles.subtitle}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {headerAction && (
            <div
              className={styles.headerAction}
              onClick={(event) => event.stopPropagation()}
            >
              {headerAction}
            </div>
          )}
        </div>
      )}

      <div className={styles.body}>
        {children}
      </div>

      {footer && (
        <div
          className={styles.footer}
          onClick={(event) => event.stopPropagation()}
        >
          {footer}
        </div>
      )}
    </div>
  );
}