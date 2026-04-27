"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["Space"], action: "Play / Pause" },
  { keys: ["→"], action: "Next track" },
  { keys: ["←"], action: "Previous / Restart" },
  { keys: ["M"], action: "Toggle mute" },
  { keys: ["F"], action: "Toggle fullscreen player" },
  { keys: ["S"], action: "Toggle shuffle" },
  { keys: ["?"], action: "Show this help" },
];

const mobileGestures = [
  { gesture: "Swipe ↑", action: "Open fullscreen player" },
  { gesture: "Swipe ↓", action: "Dismiss fullscreen player" },
  { gesture: "Swipe →", action: "Previous track" },
  { gesture: "Swipe ←", action: "Next track" },
];

export default function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "?") setOpen((v) => !v);
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-[var(--primary)]" />
                <h2 className="font-bold text-white text-base">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--muted)] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Keyboard shortcuts */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3">Desktop</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {shortcuts.map(({ keys, action }) => (
                    <div key={action} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-white/70">{action}</span>
                      <div className="flex items-center gap-1">
                        {keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2 py-0.5 rounded-md bg-[var(--surface-3)] border border-[var(--glass-border)] text-xs font-mono font-semibold text-white shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile gestures */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3">Mobile Gestures</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {mobileGestures.map(({ gesture, action }) => (
                    <div key={action} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-white/70">{action}</span>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--surface-3)] border border-[var(--glass-border)] text-xs font-semibold text-[var(--primary)]">
                        {gesture}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-[var(--muted)] text-center">
                Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--glass-border)] font-mono text-[10px]">?</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--glass-border)] font-mono text-[10px]">Esc</kbd> to close
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
