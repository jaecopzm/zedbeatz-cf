"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[var(--surface-2)] ring-1 ring-white/[0.06] flex items-center justify-center">
            <AlertCircle size={36} className="text-[var(--muted-2)]" />
          </div>
        </div>
        
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight mb-2">Something went wrong</h1>
          <p className="text-sm text-[var(--muted)]">
            An error occurred while loading this page.
          </p>
        </div>

        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-black font-bold text-[13px] rounded-full hover:brightness-110 active:scale-95 transition-all mx-auto"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}
