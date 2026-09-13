"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Home, Search, Library, Compass, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const links = [
  { href: "/",        label: "Home",    icon: Home    },
  { href: "/search",  label: "Search",  icon: Search  },
  { href: "/browse",  label: "Browse",  icon: Compass },
  { href: "/library", label: "Library", icon: Library },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--glass-hover)] transition-all duration-200"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 text-[var(--muted)] hover:text-foreground transition-colors" aria-label="Menu">
          <Menu size={22} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-background/90 border-r border-[var(--glass-border)] p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        {/* Header */}
        <div className="flex items-center px-5 py-5 border-b border-[var(--glass-border)]">
          <img src="/zedbeatz-logo.png" alt="ZedBeatz" className="h-7 w-auto" />
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
          <p className="text-[11px] font-bold text-foreground/20 uppercase tracking-[0.12em] px-3 mb-3">
            Menu
          </p>
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = path === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "text-foreground font-semibold bg-[var(--glass-hover)]"
                    : "text-foreground/35 font-medium hover:text-foreground/70 hover:bg-[var(--glass-hover)]"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--primary)]" />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={cn(
                    "shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-[var(--primary)]"
                      : "text-foreground/30"
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="px-4 py-3 border-t border-[var(--glass-border)]">
          <ThemeToggle />
        </div>

      </SheetContent>
    </Sheet>
  );
}
