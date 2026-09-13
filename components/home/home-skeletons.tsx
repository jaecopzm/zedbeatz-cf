// Skeletons mirror the real home geometry so streaming swaps don't shift layout.

export function HeroSkeleton() {
  return (
    <div className="mx-3 md:mx-6 mb-5 md:mb-6 rounded overflow-hidden bg-[var(--surface-2)] ring-1 ring-white/10">
      <div className="min-h-[210px] sm:min-h-[280px] md:min-h-[320px] flex flex-col justify-end p-4 md:p-6 gap-2">
        <div className="h-3 w-24 shimmer rounded" />
        <div className="h-8 md:h-11 w-2/3 shimmer rounded" />
        <div className="h-3 w-40 shimmer rounded" />
        <div className="flex gap-1.5 mt-1">
          <div className="h-1 w-6 shimmer rounded-full" />
          <div className="h-1 w-2.5 shimmer rounded-full" />
          <div className="h-1 w-2.5 shimmer rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function QuickPicksSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 rounded overflow-hidden bg-white/[0.03] min-h-[44px] md:min-h-[48px]">
          <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 shimmer" />
          <div className="h-3 flex-1 mr-3 shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-2 lg:gap-x-8">
      {[0, 1].map((ci) => (
        <div key={ci} className="min-w-[78%] sm:min-w-[55%] lg:min-w-0 flex flex-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2 border-b border-white/[0.06]">
              <div className="w-6 h-4 shimmer rounded shrink-0" />
              <div className="w-10 h-10 rounded shimmer shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 shimmer rounded" />
                <div className="h-2.5 w-1/3 shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function RailSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="flex gap-2 md:gap-2.5 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[148px] md:w-[160px]">
          <div className="aspect-square rounded shimmer mb-2" />
          <div className="h-3 w-full shimmer rounded mb-1.5" />
          <div className="h-2.5 w-2/3 shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

export function ArtistSkeleton() {
  return (
    <div className="flex gap-2 md:gap-2.5 overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[96px] md:w-[112px]">
          <div className="w-[96px] h-[96px] md:w-[112px] md:h-[112px] rounded-full shimmer" />
          <div className="h-3 w-3/4 shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

export function PillsSkeleton() {
  return (
    <div className="flex gap-1.5 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-9 w-24 shrink-0 shimmer rounded-full" />
      ))}
    </div>
  );
}
