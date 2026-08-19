import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { subscribeToast, type ToastPayload } from "@/lib/toast";

const AUTO_DISMISS_MS = 3000;

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    return subscribeToast((payload) => {
      setToasts((prev) => [...prev, payload]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== payload.id));
      }, AUTO_DISMISS_MS);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-xl animate-in fade-in slide-in-from-top-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/15">
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </span>
          <span className="text-sm font-medium text-text">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
