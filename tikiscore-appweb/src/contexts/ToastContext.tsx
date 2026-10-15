import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Toast, {
  type ToastData,
  type ToastVariant,
} from "../composants/ui/Toast";

import toastStyles from "../composants/ui/Toast/Toast.module.css";

export interface ShowToastOptions {
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  showToast: (
    options: ShowToastOptions
  ) => string;

  success: (
    message: string,
    title?: string
  ) => string;

  error: (
    message: string,
    title?: string
  ) => string;

  warning: (
    message: string,
    title?: string
  ) => string;

  info: (
    message: string,
    title?: string
  ) => string;

  removeToast: (id: string) => void;
  clearToasts: () => void;
}

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

const DEFAULT_DURATION = 5_000;
const DEFAULT_MAX_TOASTS = 5;

const ToastContext =
  createContext<ToastContextValue | undefined>(
    undefined
  );

function generateToastId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function ToastProvider({
  children,
  maxToasts = DEFAULT_MAX_TOASTS,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter(
        (toast) => toast.id !== id
      )
    );
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    ({
      message,
      title,
      variant = "info",
      duration = DEFAULT_DURATION,
    }: ShowToastOptions): string => {
      const id = generateToastId();

      const newToast: ToastData = {
        id,
        message,
        title,
        variant,
        duration,
      };

      setToasts((currentToasts) => {
        const updatedToasts = [
          newToast,
          ...currentToasts,
        ];

        return updatedToasts.slice(
          0,
          Math.max(1, maxToasts)
        );
      });

      return id;
    },
    [maxToasts]
  );

  const success = useCallback(
    (message: string, title?: string) =>
      showToast({
        message,
        title,
        variant: "success",
      }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) =>
      showToast({
        message,
        title,
        variant: "error",
      }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) =>
      showToast({
        message,
        title,
        variant: "warning",
      }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) =>
      showToast({
        message,
        title,
        variant: "info",
      }),
    [showToast]
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      success,
      error,
      warning,
      info,
      removeToast,
      clearToasts,
    }),
    [
      showToast,
      success,
      error,
      warning,
      info,
      removeToast,
      clearToasts,
    ]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div
        className={toastStyles.viewport}
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast doit être utilisé à l’intérieur de ToastProvider."
    );
  }

  return context;
}