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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={48} className="text-red-500" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong!</h1>
          <p className="text-[var(--muted)]">
            An error occurred while loading this page.
          </p>
        </div>

        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-white hover:scale-105 active:scale-100 text-black font-semibold rounded-md transition-all mx-auto"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    </div>
  );
}
