"use client";

import { LayoutGrid, List } from "lucide-react";

export default function ViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-[var(--surface)] rounded-lg p-0.5 border border-[var(--border)]">
      <button
        onClick={() => onChange("grid")}
        className={`p-1.5 rounded-md transition-all ${
          view === "grid"
            ? "bg-[var(--surface-2)] text-foreground"
            : "text-[var(--muted)] hover:text-foreground"
        }`}
        aria-label="Grid view"
      >
        <LayoutGrid size={14} />
      </button>
      <button
        onClick={() => onChange("list")}
        className={`p-1.5 rounded-md transition-all ${
          view === "list"
            ? "bg-[var(--surface-2)] text-foreground"
            : "text-[var(--muted)] hover:text-foreground"
        }`}
        aria-label="List view"
      >
        <List size={14} />
      </button>
    </div>
  );
}
