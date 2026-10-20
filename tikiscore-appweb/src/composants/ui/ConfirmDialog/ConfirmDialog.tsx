import { TriangleAlert } from "lucide-react";
import Button from "../Button";
import Modal from "../Modal";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmDialog({
  open, onConfirm, onCancel, title, message, variant = "default", isLoading = false,
  confirmLabel = "Confirmer", cancelLabel = "Annuler",
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      className={styles.dialog}
      footer={(
        <>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>{cancelLabel}</Button>
          <Button variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <div className={`${styles.message} ${variant === "danger" ? styles.danger : ""}`}>
        {variant === "danger" && <TriangleAlert className={styles.icon} size={22} aria-hidden="true" />}
        <p>{message}</p>
      </div>
    </Modal>
  );
}