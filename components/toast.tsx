"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

type Toast = { id: string; message: string; type: "success" | "error" | "info" };

let toastQueue: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

export function showToast(message: string, type: "success" | "error" | "info" = "info") {
  if ('vibrate' in navigator) {
    navigator.vibrate(type === "success" ? 10 : type === "error" ? [10, 50, 10] : 5);
  }
  const toast: Toast = { id: Date.now().toString(), message, type };
  toastQueue = [...toastQueue, toast];
  listeners.forEach((l) => l(toastQueue));
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== toast.id);
    listeners.forEach((l) => l(toastQueue));
  }, 3500);
}

const iconMap = {
  success: { Icon: CheckCircle2, color: "text-[var(--primary)]" },
  error:   { Icon: AlertCircle,  color: "text-red-400"          },
  info:    { Icon: Info,         color: "text-blue-400"         },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => { listeners = listeners.filter((l) => l !== setToasts); };
  }, []);

  function remove(id: string) {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    setToasts([...toastQueue]);
  }

  return (
    <div className="fixed bottom-36 right-4 z-[200] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => {
        const { Icon, color } = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 glass-card rounded-xl px-4 py-3 shadow-2xl min-w-[260px] max-w-[340px] animate-toast-in"
          >
            <Icon size={18} className={`${color} shrink-0`} />
            <p className="text-sm flex-1 text-white/90 font-medium leading-snug">{toast.message}</p>
            <button
              onClick={() => remove(toast.id)}
              className="text-[var(--muted)] hover:text-white transition-colors shrink-0 p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
