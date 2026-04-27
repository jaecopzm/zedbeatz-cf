"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Compass, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

const links = [
  { href: "/",        label: "Home",    icon: Home    },
  { href: "/search",  label: "Search",  icon: Search  },
  { href: "/browse",  label: "Browse",  icon: Compass },
  { href: "/library", label: "Library", icon: Library },
  { href: "/stats",   label: "Your Stats", icon: BarChart3 },
];

export default function Sidebar() {
  const path = usePathname();
  const { isSignedIn, user } = useUser();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col h-full bg-black/60 border-r border-[var(--border)] relative overflow-hidden">
      {/* Ambient glow top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent" />

      {/* Logo */}
      <div className="px-6 py-7 shrink-0">
        <Link href="/" className="group">
          <img src="/Logo.png" alt="ZedBeatz" className="h-8 w-auto group-hover:scale-105 transition-transform duration-300" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 flex-1">
        <p className="text-[10px] font-semibold text-[var(--muted-2)] uppercase tracking-widest px-3 mb-2">
          Menu
        </p>
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group",
                isActive
                  ? "text-white"
                  : "text-[var(--muted)] hover:text-white hover:bg-[var(--glass-hover)]"
              )}
            >
              {/* Active pill */}
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-[var(--glass-hover)] border border-[var(--glass-border)]" />
              )}
              {/* Active left accent */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[var(--primary)]" />
              )}
              <span className={cn(
                "relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                isActive
                  ? "bg-[var(--primary-dim)] text-[var(--primary)]"
                  : "text-[var(--muted)] group-hover:text-white"
              )}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom accent */}
      <div className="px-6 py-6 shrink-0">
        {isSignedIn ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <UserButton />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.firstName ?? user.username}</p>
              <p className="text-[10px] text-[var(--muted)] truncate">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        ) : (
          <SignInButton mode="modal">
            <button className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-black text-xs font-bold hover:opacity-90 transition-opacity">
              Sign In
            </button>
          </SignInButton>
        )}
      </div>

      {/* Bottom ambient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />
    </aside>
  );
}
