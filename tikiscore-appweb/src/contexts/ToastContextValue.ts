import { createContext } from "react";
import type { ToastVariant } from "../composants/ui/Toast";

export interface ShowToastOptions {
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastContextValue {
  showToast: (options: ShowToastOptions) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);