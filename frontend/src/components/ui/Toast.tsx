"use client";

import React, { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const toastContext = React.createContext<{
  showToast: (message: string, type: ToastType) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <toastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-xs">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`glass p-4 rounded-lg animate-in fade-in slide-in-from-bottom-4 ${
              toast.type === "success"
                ? "border-green-500/50 bg-green-500/10"
                : toast.type === "error"
                  ? "border-red-500/50 bg-red-500/10"
                  : "border-blue-500/50 bg-blue-500/10"
            }`}
          >
            <p className="text-sm text-white flex items-center justify-between">
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-lg hover:opacity-70"
              >
                ×
              </button>
            </p>
          </div>
        ))}
      </div>
    </toastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(toastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
