"use client";

import { ChevronDown } from "lucide-react";

type Tab = {
  id: string;
  label: string;
  count?: number;
  href?: string;
};

export default function ArtistTabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: {
  tabs: Tab[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}) {
  return (
    <nav
      className={`flex items-center gap-1 px-4 md:px-10 mb-6 border-b border-[var(--border)] ${className}`}
      role="tablist"
      aria-label="Artist sections"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          onClick={() => onChange(tab.id)}
          className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
            activeTab === tab.id
              ? "text-[var(--primary)]"
              : "text-[var(--muted)] hover:text-foreground"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
              {tab.count > 999 ? `${(tab.count / 1000).toFixed(1)}k` : tab.count}
            </span>
          )}
          {activeTab === tab.id && (
            <div
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--primary)] rounded-t-full animate-scale-in"
            />
          )}
        </button>
      ))}
      <div className="flex-1" />
      <button
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-foreground transition-colors hidden md:flex"
        aria-label="More options"
      >
        <ChevronDown size={14} />
      </button>
    </nav>
  );
}