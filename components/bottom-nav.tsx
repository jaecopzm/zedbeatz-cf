"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MagnifyingGlass, Books } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/",        label: "Home",    icon: House    },
  { href: "/search",  label: "Search",  icon: MagnifyingGlass  },
  { href: "/library", label: "Library", icon: Books },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}>
      {/* Floating pill dock */}
      <div className="relative rounded-full border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)] shadow-[0_16px_48px_rgba(0,0,0,0.6)] flex p-1.5 gap-1">
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
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full transition-all duration-200 active:scale-95",
                isActive ? "bg-[var(--primary)] text-black shadow-lg shadow-primary/25" : "text-[var(--muted)] hover:text-foreground"
              )}
            >
              <span className="relative z-10">
                <Icon
                  size={18}
                  weight={isActive ? "fill" : "regular"}
                />
              </span>
              <span className="relative z-10 text-xs font-bold tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
