"use client";
import Link from "next/link";
import { Music2, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[var(--surface-2)] ring-1 ring-white/[0.06] flex items-center justify-center">
            <Music2 size={40} className="text-[var(--muted-2)]" />
          </div>
        </div>
        
        <div>
          <h1 className="font-display text-5xl font-bold mb-1">404</h1>
          <h2 className="font-display text-xl font-bold tracking-tight mb-2">Track not found</h2>
          <p className="text-sm text-[var(--muted)]">
            The page you’re looking for doesn’t exist or has been moved.
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <Link 
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-black font-bold text-[13px] rounded-full hover:brightness-110 active:scale-95 transition-all"
          >
            <Home size={16} />
            Go home
          </Link>
          <Link 
            href="/search"
            className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] ring-1 ring-white/10 rounded-full text-[13px] font-semibold hover:bg-white/[0.1] transition-colors"
          >
            Search tracks
          </Link>
        </div>
      </div>
    </div>
  );
}
