"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Compass, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/browse", label: "Browse", icon: Compass },
  { href: "/library", label: "Library", icon: Library },
  { href: "/stats", label: "Your Stats", icon: BarChart3 },
];

export default function Sidebar() {
  const path = usePathname();
  const { isSignedIn, user } = useUser();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col h-full bg-black border-r border-[var(--border)] relative">
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
        <p className="text-[11px] font-bold text-white/20 uppercase tracking-[0.12em] px-3 mb-4">
          Menu
        </p>

        {links.map(({ href, label, icon: Icon }) => {
          const isActive = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group",
                isActive
                  ? "text-white/70 font-medium"
                  : "text-white/35 font-medium hover:text-white/60"
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={cn(
                  "shrink-0 transition-colors duration-200",
                  isActive
                    ? "text-[var(--primary)]"
                    : "text-white/30 group-hover:text-white/60"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-6 h-px bg-[var(--border)] shrink-0" />

      {/* User area */}
      <div className="px-5 py-5 shrink-0">
        {isSignedIn ? (
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white truncate leading-tight">
                {user.firstName ?? user.username}
              </p>
              <p className="text-[11px] text-white/35 truncate mt-0.5">
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