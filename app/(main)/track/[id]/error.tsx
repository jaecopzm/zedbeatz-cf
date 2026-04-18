"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function TrackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error("Track error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={40} className="text-red-500" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold mb-2">Track Unavailable</h1>
          <p className="text-[var(--muted)]">
            We couldn't load the details for this track. Please try again.
          </p>
        </div>

        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-white hover:scale-105 active:scale-100 text-black font-semibold rounded-full transition-all mx-auto"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    </div>
  );
}
