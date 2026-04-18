export function HeroSkeleton() {
  return (
    <div className="relative h-[400px] md:h-[500px] mb-8 md:mb-14 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-2)] to-transparent animate-pulse" />
      <div className="relative h-full px-4 md:px-8 flex items-end pb-8">
        <div className="space-y-4 w-full max-w-2xl">
          <div className="h-8 md:h-12 bg-[var(--surface-3)] rounded-lg w-3/4 animate-pulse" />
          <div className="h-6 bg-[var(--surface-3)] rounded-lg w-1/2 animate-pulse" />
          <div className="flex gap-3 mt-6">
            <div className="h-12 w-32 bg-[var(--surface-3)] rounded-full animate-pulse" />
            <div className="h-12 w-32 bg-[var(--surface-3)] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-[var(--surface-2)] p-4 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="aspect-square rounded-lg bg-[var(--surface-3)] mb-3" />
          <div className="h-4 bg-[var(--surface-3)] rounded w-3/4 mb-2" />
          <div className="h-3 bg-[var(--surface-3)] rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function TrackGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-[var(--surface-2)] p-3 animate-pulse" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="aspect-square rounded-lg bg-[var(--surface-3)] mb-2" />
          <div className="h-3 bg-[var(--surface-3)] rounded w-full mb-1.5" />
          <div className="h-2.5 bg-[var(--surface-3)] rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function ArtistGridSkeleton() {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="w-full aspect-square rounded-full bg-[var(--surface-2)]" />
          <div className="h-3 bg-[var(--surface-2)] rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function PlaylistGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-[var(--surface-2)] p-4 animate-pulse" style={{ animationDelay: `${i * 45}ms` }}>
          <div className="aspect-square rounded-xl bg-[var(--surface-3)] mb-3" />
          <div className="h-4 bg-[var(--surface-3)] rounded w-full mb-2" />
          <div className="h-3 bg-[var(--surface-3)] rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
