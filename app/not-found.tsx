"use client";
import Link from "next/link";
import { Music2, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
            <Music2 size={48} className="text-[var(--muted)]" />
          </div>
        </div>
        
        <div>
          <h1 className="text-6xl font-bold mb-2">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Track Not Found</h2>
          <p className="text-[var(--muted)]">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link 
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-white hover:scale-105 active:scale-100 text-black font-semibold rounded-md transition-all"
          >
            <Home size={18} />
            Go Home
          </Link>
          <Link 
            href="/search"
            className="flex items-center gap-2 px-6 py-3 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] rounded-md transition-colors"
          >
            Search Tracks
          </Link>
        </div>
      </div>
    </div>
  );
}
