"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/",        label: "Home",    icon: Home    },
  { href: "/search",  label: "Search",  icon: Search  },
  { href: "/browse",  label: "Browse",  icon: Compass },
  { href: "/library", label: "Library", icon: Library },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Glass bar */}
      <div className="relative glass-card border-t border-[var(--glass-border)] flex">
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent" />

        {links.map(({ href, label, icon: Icon }) => {
          const isActive = path === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(10);
              }}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 py-3 transition-all duration-200 relative",
                isActive ? "text-[var(--primary)]" : "text-[var(--muted)]"
              )}
            >
              <span className="relative z-10">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </span>
              <span className="relative z-10 text-[10px] font-semibold tracking-wide">
                {label}
              </span>
              {/* Active indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)] animate-scale-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
