"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { House, MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function Topbar() {
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState("");

  return (
    <div className="hidden md:flex sticky top-0 z-30 items-center gap-2.5 px-4 md:px-6 py-2.5 bg-[var(--surface)]/85 backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)]">
      <Link
        href="/"
        aria-label="Home"
          className={cn(
          "flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all hover:scale-105 active:scale-95",
          path === "/"
            ? "bg-[var(--primary)] text-black"
            : "bg-white/[0.06] text-[var(--foreground)] hover:bg-white/[0.1]"
        )}
      >
        <House size={18} weight={path === "/" ? "fill" : "regular"} />
      </Link>

      <form
        className="flex items-center gap-2 flex-1 max-w-[480px] h-9 px-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.09] focus-within:bg-white/[0.09] focus-within:ring-1 focus-within:ring-[var(--primary)]/40 transition-all"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search");
        }}
      >
        <MagnifyingGlass size={16} weight="bold" className="text-[var(--muted)] shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search"
          placeholder="Search songs, artists, albums"
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px] font-medium placeholder:text-[var(--muted)] text-[var(--foreground)]"
        />
      </form>

      <div className="flex-1" />

      <Link
        href="/browse"
        className="hidden xl:flex items-center px-3.5 h-8 rounded-full text-[13px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.06] transition-all"
      >
        Browse
      </Link>
      <Link
        href="/library"
        className="hidden xl:flex items-center px-3.5 h-8 rounded-full text-[13px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.06] transition-all"
      >
        Library
      </Link>
    </div>
  );
}
