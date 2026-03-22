import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
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

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
