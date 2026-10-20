import { LoaderCircle } from "lucide-react";
import styles from "./Loader.module.css";

export type LoaderVariant = "spinner" | "dots" | "page";
export type LoaderSize = "small" | "medium" | "large";

export interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function Loader({
  variant = "spinner", size = "medium", label = "Chargement...", fullScreen = false, className = "",
}: LoaderProps) {
  const content = (
    <div className={`${styles.loader} ${styles[size]} ${styles[variant]} ${className}`} role="status" aria-label={label}>
      {variant === "dots" ? (
        <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
      ) : (
        <LoaderCircle className={styles.icon} aria-hidden="true" />
      )}
      <span className={styles.label}>{label}</span>
    </div>
  );

  return fullScreen || variant === "page" ? <div className={styles.fullScreen}>{content}</div> : content;
}