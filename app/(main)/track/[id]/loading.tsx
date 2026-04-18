import { ChevronLeft } from "lucide-react";

export default function TrackLoading() {
  return (
    <div className="min-h-screen pb-32 bg-gradient-to-b from-[var(--background)] via-[var(--background)] to-black/40">
      <section className="relative px-3 sm:px-4 md:px-8 pt-4 sm:pt-6 md:pt-10 pb-6 sm:pb-8 md:pb-16 max-w-7xl mx-auto">
        {/* Back Link Skeleton */}
        <div className="relative inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-white/20 mb-5 sm:mb-8 md:mb-10">
          <ChevronLeft size={13} />
          Back
        </div>

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 md:gap-12 animate-pulse">
          {/* Artwork Skeleton */}
          <div className="relative shrink-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-2xl sm:rounded-3xl bg-[var(--surface-2)] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/10" />

          {/* Info Skeleton */}
          <div className="flex-1 w-full flex flex-col items-center sm:items-start space-y-4 md:space-y-6 mt-2 sm:mt-0">
            {/* Genre + plays Skeleton */}
            <div className="flex gap-2">
              <div className="h-4 w-16 bg-white/[0.07] rounded-full" />
              <div className="h-4 w-12 bg-white/[0.07] rounded-full" />
            </div>

            {/* Title Skeleton */}
            <div className="space-y-2 w-full flex flex-col items-center sm:items-start">
              <div className="h-8 sm:h-12 md:h-16 w-3/4 max-w-md bg-white/[0.05] rounded-xl" />
              <div className="h-8 sm:h-12 md:h-16 w-1/2 max-w-xs bg-white/[0.05] rounded-xl" />
            </div>

            <div className="flex flex-wrap gap-2 w-full justify-center sm:justify-start">
              <div className="h-4 w-24 bg-white/[0.05] rounded" />
              <div className="hidden sm:block h-4 w-32 bg-white/[0.05] rounded" />
            </div>

            {/* Actions Skeleton */}
            <div className="flex gap-3 pt-2">
              <div className="h-10 sm:h-12 w-28 sm:w-32 bg-[var(--primary)]/20 rounded-full" />
              <div className="h-10 sm:h-12 w-36 sm:w-48 bg-white/[0.05] rounded-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
