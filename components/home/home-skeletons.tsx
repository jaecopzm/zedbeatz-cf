export function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden mb-6 md:mb-10 rounded-xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20">
      <div className="absolute inset-0 bg-background/40" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 md:p-8">
        {/* Album Art */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 shrink-0 rounded-lg overflow-hidden bg-[var(--glass-hover)] shimmer-wave" />

        {/* Info */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="h-3 w-20 bg-[var(--surface-2)] mx-auto md:mx-0" />
          <div className="h-8 md:h-12 bg-[var(--surface-2)] w-3/4 mx-auto md:mx-0" />
          <div className="h-5 bg-[var(--surface-2)] w-1/2 mx-auto md:mx-0" />
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <div className="h-12 w-32 bg-[var(--surface-3)] rounded-full" />
            <div className="h-12 w-28 bg-[var(--glass-hover)] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={`aspect-square bg-[var(--surface)] shimmer-wave relative${i >= 6 ? " hidden md:block" : ""}`} style={{ animationDelay: `${i * 50}ms` }}>
          <div className="absolute top-2 left-2 w-6 h-6 bg-[var(--surface-2)]" />
          <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 space-y-1">
            <div className="h-2.5 md:h-3 bg-[var(--surface-2)] w-3/4" />
            <div className="h-2 md:h-2.5 bg-[var(--surface-2)] w-1/2" />
          </div>
        </div>
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
    <div className="flex gap-2 md:gap-3 overflow-x-hidden pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[140px] md:w-[180px]" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="aspect-square shimmer-wave mb-2" />
          <div className="h-3 shimmer-wave w-full mb-1.5" />
          <div className="h-2.5 shimmer-wave w-2/3" />
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
    <div className="flex gap-2 md:gap-3 overflow-x-hidden pb-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[140px] md:w-[176px] p-1.5 md:p-2 shimmer-wave" style={{ animationDelay: `${i * 45}ms` }}>
          <div className="aspect-square bg-[var(--surface-3)] mb-1.5 md:mb-2" />
          <div className="h-3.5 bg-[var(--surface-3)] w-full mb-2" />
          <div className="h-2.5 bg-[var(--surface-3)] w-1/2" />
        </div>
      ))}
    </div>
  );
}
