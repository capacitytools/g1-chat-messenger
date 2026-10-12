"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = {
  id: number;
  title: string;
  body: string;
  href?: string;
};

type ToastContextType = {
  showToast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <a
            key={t.id}
            href={t.href ?? "#"}
            className="pointer-events-auto block w-72 rounded-xl border border-g1-border bg-g1-surface p-3 shadow-lg"
          >
            <p className="text-xs font-medium">{t.title}</p>
            <p className="mt-0.5 truncate text-xs text-g1-muted">{t.body}</p>
          </a>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}