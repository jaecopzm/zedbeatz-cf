export function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden mb-6 md:mb-10" style={{ minHeight: "460px" }}>
      <div className="absolute inset-0 shimmer-wave" />
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 z-10">
        <div className="h-full w-1/3 bg-white/20" />
      </div>

      <div className="relative h-full" style={{ minHeight: "460px" }}>
        {/* Badge - mobile */}
        <div className="absolute top-4 left-4 md:hidden">
          <div className="h-7 w-16 bg-[var(--surface-3)] rounded-full" />
        </div>

        <div className="absolute bottom-10 left-4 right-4 md:bottom-14 md:left-10 md:right-10 md:flex md:flex-row md:items-end md:gap-0">
          {/* Left: text + controls */}
          <div className="flex-1 max-w-xl space-y-4 md:space-y-6">
            {/* Badge - desktop */}
            <div className="hidden md:block h-7 w-20 bg-[var(--surface-3)] rounded-full" />
            
            {/* Title */}
            <div className="h-7 md:h-10 lg:h-12 bg-[var(--surface-3)] rounded-xl w-4/5" />
            
            {/* Artist */}
            <div className="h-4 md:h-5 bg-[var(--surface-3)] rounded-lg w-1/3" />
            
            {/* CTA buttons */}
            <div className="flex gap-3">
              <div className="h-11 md:h-12 w-28 md:w-32 bg-[var(--surface-3)] rounded-full" />
              <div className="h-11 md:h-12 w-24 md:w-28 bg-[var(--surface-3)] rounded-full" />
            </div>
            
            {/* Thumbnail strip */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--surface-3)] shrink-0" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`rounded-lg bg-[var(--surface-3)] shrink-0 ${
                      i === 0 ? "w-14 h-14 md:w-16 md:h-16" : "w-10 h-10 md:w-12 md:h-12"
                    }`} 
                  />
                ))}
              </div>
              <div className="w-7 h-7 rounded-full bg-[var(--surface-3)] shrink-0" />
            </div>
          </div>

          {/* Right: Large album art (desktop only) */}
          <div className="hidden lg:block shrink-0 ml-auto pr-4">
            <div className="w-[280px] h-[280px] xl:w-[320px] xl:h-[320px] rounded-2xl bg-[var(--surface-3)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      {/* Large card */}
      <div className="col-span-2 row-span-2 rounded-2xl shimmer-wave h-[260px] md:h-[340px]" />
      {/* Small cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl shimmer-wave h-[130px] md:h-[162px]" style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

export function RecentlyPlayedSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl shimmer-wave h-16" style={{ animationDelay: `${i * 70}ms` }} />
      ))}
    </div>
  );
}

export function TrackGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="flex gap-3 md:gap-4 overflow-x-hidden pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[140px] md:w-[180px]" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="aspect-square rounded-xl shimmer-wave mb-2" />
          <div className="h-3 shimmer-wave rounded w-full mb-1.5" />
          <div className="h-2.5 shimmer-wave rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function ArtistGridSkeleton() {
  return (
    <div className="flex gap-4 md:gap-6 overflow-x-hidden pb-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[80px] md:w-[96px]" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="w-full aspect-square rounded-full shimmer-wave" />
          <div className="h-3 shimmer-wave rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function PlaylistGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-3 shimmer-wave" style={{ animationDelay: `${i * 45}ms` }}>
          <div className="aspect-square rounded-xl bg-[var(--surface-3)] mb-3" />
          <div className="h-3.5 bg-[var(--surface-3)] rounded w-full mb-2" />
          <div className="h-2.5 bg-[var(--surface-3)] rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
