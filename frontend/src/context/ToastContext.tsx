import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "warning";

export interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: ToastState | null;
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

declare global {
  interface Window {
    __ccirsToastTimer?: number;
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
    window.clearTimeout(window.__ccirsToastTimer);
    window.__ccirsToastTimer = window.setTimeout(() => setToast(null), 2800);
  };

  const clearToast = () => setToast(null);

  const value = useMemo(
    () => ({
      toast,
      showToast,
      clearToast,
    }),
    [toast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
