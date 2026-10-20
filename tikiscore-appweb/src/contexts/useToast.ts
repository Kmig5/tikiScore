import { useContext } from "react";
import { ToastContext, type ToastContextValue } from "./ToastContextValue";

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast doit être utilisé à l’intérieur de ToastProvider.");
  return context;
}