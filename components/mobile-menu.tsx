"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Search, Library, Compass, LogOut, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInButton, useUser, useClerk } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const links = [
  { href: "/",        label: "Home",    icon: Home    },
  { href: "/search",  label: "Search",  icon: Search  },
  { href: "/browse",  label: "Browse",  icon: Compass },
  { href: "/library", label: "Library", icon: Library },
  { href: "/stats",   label: "Your Stats", icon: BarChart3 },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 text-[var(--muted)] hover:text-white transition-colors" aria-label="Menu">
          <Menu size={22} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-black/90 border-r border-[var(--glass-border)] p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        {/* Header */}
        <div className="flex items-center px-5 py-5 border-b border-[var(--glass-border)]">
          <img src="/Logo.png" alt="ZedBeatz" className="h-7 w-auto" />
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = path === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[var(--glass-hover)] text-white border border-[var(--glass-border)]"
                    : "text-[var(--muted)] hover:text-white hover:bg-[var(--glass-hover)]"
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isActive ? "bg-[var(--primary-dim)] text-[var(--primary)]" : ""
                )}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-5 border-t border-[var(--glass-border)]">
          {isSignedIn ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-[var(--primary-dim)] flex items-center justify-center text-[var(--primary)] text-sm font-bold shrink-0">
                  {(user.firstName ?? user.username ?? "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.firstName ?? user.username}</p>
                  <p className="text-[10px] text-[var(--muted)] truncate">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <SignInButton mode="modal">
              <button className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-black text-xs font-bold hover:opacity-90 transition-opacity">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
