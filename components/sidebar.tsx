"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sun, MoonStar } from "lucide-react";
import { House, MagnifyingGlass, Books, CaretDoubleLeft, CaretDoubleRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

const links = [
  { href: "/", label: "Home", icon: House },
  { href: "/search", label: "Search", icon: MagnifyingGlass },
  { href: "/library", label: "Library", icon: Books },
];

const STORAGE_KEY = "zedbeatz-sidebar-collapsed";

export default function Sidebar() {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setCollapsed(stored === "1");
      } else {
        // Tablet (md–lg): start as icon rail so content + dock have room
        setCollapsed(window.matchMedia("(max-width: 1023.5px)").matches);
      }
    } catch {}
    setReady(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col h-full relative transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[76px]" : "w-[220px]",
        !ready && "transition-none"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className={cn("flex items-center py-6 shrink-0", collapsed ? "justify-center px-0" : "justify-between pl-5 pr-3")}>
        {!collapsed && (
          <Link href="/" className="group inline-block overflow-hidden">
            <img
              src="/zedbeatz-logo.png"
              alt="ZedBeatz"
              className="h-8 w-auto transition-opacity duration-200 group-hover:opacity-80"
            />
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="group inline-block">
            <img
              src="/zedbeatz-icon.png"
              alt="ZedBeatz"
              className="h-9 w-9 transition-opacity duration-200 group-hover:opacity-80"
            />
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted-2)] hover:text-[var(--foreground)] hover:bg-white/[0.06] transition-colors shrink-0"
          >
            <CaretDoubleLeft size={16} weight="bold" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-3 flex-1 gap-1.5">
        {!collapsed && (
          <p className="text-[11px] font-bold text-[var(--muted-2)] uppercase tracking-[0.12em] px-4 mb-2 whitespace-nowrap overflow-hidden">
            Menu
          </p>
        )}

        {links.map(({ href, label, icon: Icon }) => {
          const isActive = path === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center py-2.5 rounded-full text-[15px] font-semibold transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98]",
                collapsed ? "justify-center gap-0 px-0" : "gap-3 px-4",
                isActive
                  ? "text-black bg-[var(--primary)] shadow-lg shadow-primary/20"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.06]"
              )}
            >
              <Icon
                size={20}
                weight={isActive ? "fill" : "regular"}
                className={cn(
                  "shrink-0 transition-colors duration-200",
                  isActive ? "text-black" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
                )}
              />
              <span
                className={cn(
                  "whitespace-nowrap overflow-hidden transition-[opacity,transform] duration-200",
                  collapsed ? "opacity-0 w-0 -translate-x-2" : "opacity-100 w-auto translate-x-0"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center pb-2">
          <button
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--muted-2)] hover:text-[var(--foreground)] hover:bg-white/[0.06] transition-colors"
          >
            <CaretDoubleRight size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="mx-6 h-px bg-[var(--border)] shrink-0" />

      {/* Theme toggle */}
      <div className={cn("py-5 shrink-0 flex flex-col gap-3", collapsed ? "px-0 items-center" : "px-4")}>
        <button
          onClick={toggle}
          title={collapsed ? (theme === "dark" ? "Light mode" : "Dark mode") : undefined}
          className={cn(
            "flex items-center gap-3 py-2.5 rounded-full text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.06] transition-all duration-200",
            collapsed ? "justify-center px-0 w-10 h-10" : "px-4"
          )}
        >
          {ready && theme === "dark" ? <Sun size={18} /> : <MoonStar size={18} />}
          {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
        </button>
      </div>
    </aside>
  );
}
