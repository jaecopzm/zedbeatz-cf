"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Sun, MoonStar } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "./theme-provider";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
];

export default function Sidebar() {
  const path = usePathname();
  const { isSignedIn, user } = useUser();
  const { theme, toggle } = useTheme();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col h-full border-r border-[var(--border)] relative">
      {/* Logo */}
      <div className="px-6 py-7 shrink-0">
        <Link href="/" className="group inline-block">
          <img
            src="/Logo.png"
            alt="ZedBeatz"
            className="h-9 w-auto transition-opacity duration-200 group-hover:opacity-80"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-3 flex-1 gap-0.5">
        <p className="text-[11px] font-bold text-[var(--muted-2)] uppercase tracking-[0.12em] px-3 mb-4">
          Menu
        </p>

        {links.map(({ href, label, icon: Icon }) => {
          const isActive = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3.5 px-3 py-3 rounded-lg text-[16px] font-semibold transition-all duration-200 group",
                isActive
                  ? "text-[var(--foreground)] bg-[var(--surface-hover)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              )}
            >
              <Icon
                size={26}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={cn(
                  "shrink-0 transition-colors duration-200",
                  isActive ? "text-[var(--primary)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-6 h-px bg-[var(--border)] shrink-0" />

      {/* Theme toggle + User area */}
      <div className="px-5 py-5 shrink-0 flex flex-col gap-4">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all duration-200"
        >
          {theme === "dark" ? <Sun size={18} /> : <MoonStar size={18} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        {isSignedIn ? (
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[var(--foreground)] truncate leading-tight">
                {user.firstName ?? user.username}
              </p>
              <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        ) : (
          <SignInButton mode="modal">
            <button className="w-full py-2.5 rounded-lg bg-[var(--primary)] text-black text-xs font-bold hover:opacity-90 hover:shadow-[var(--glow-primary)] transition-all duration-200">
              Sign In
            </button>
          </SignInButton>
        )}
      </div>
    </aside>
  );
}