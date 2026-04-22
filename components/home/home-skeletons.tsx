export function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden mb-6 md:mb-10" style={{ minHeight: "460px" }}>
      <div className="absolute inset-0 shimmer-wave" />
      <div className="relative h-full" style={{ minHeight: "460px" }}>
        <div className="absolute bottom-6 left-4 right-4 md:static md:flex md:flex-row md:items-center md:h-full md:px-10 md:py-14 md:gap-6">
          <div className="flex-1 max-w-xl space-y-3 md:space-y-4">
            <div className="h-5 md:h-6 w-28 md:w-36 bg-[var(--surface-3)] rounded-full" />
            <div className="h-8 md:h-16 bg-[var(--surface-3)] rounded-xl w-4/5" />
            <div className="h-4 md:h-5 bg-[var(--surface-3)] rounded-lg w-1/3" />
            <div className="flex gap-2 md:gap-3 pt-1 md:pt-2">
              <div className="h-9 md:h-11 w-28 md:w-32 bg-[var(--surface-3)] rounded-full" />
              <div className="h-9 md:h-11 w-20 md:w-24 bg-[var(--surface-3)] rounded-full" />
            </div>
            <div className="flex gap-2 pt-1 md:pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[var(--surface-3)]" />
              ))}
            </div>
          </div>
          <div className="hidden lg:block w-[280px] xl:w-[320px] aspect-square rounded-2xl bg-[var(--surface-3)] shrink-0" />
        </div>
      </div>
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {/* Large card */}
      <div className="col-span-2 row-span-2 rounded-2xl shimmer-wave h-[260px] md:h-[340px]" />
      {/* Small cards */}
      {Array.from({ length: 6 }).map((_, i) => (
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
