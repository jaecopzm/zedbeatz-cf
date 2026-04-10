export function TrackCardSkeleton() {
  return (
    <div className="rounded-lg p-4 bg-[var(--surface)] animate-pulse">
      <div className="aspect-square rounded-md bg-[var(--surface-2)] mb-4" />
      <div className="h-4 bg-[var(--surface-2)] rounded w-3/4 mb-2" />
      <div className="h-3 bg-[var(--surface-2)] rounded w-1/2" />
    </div>
  );
}

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-md bg-[var(--surface)] animate-pulse">
      <div className="w-6 h-4 bg-[var(--surface-2)] rounded" />
      <div className="w-12 h-12 rounded bg-[var(--surface-2)]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[var(--surface-2)] rounded w-1/3" />
        <div className="h-3 bg-[var(--surface-2)] rounded w-1/4" />
      </div>
    </div>
  );
}

export function HeroCardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className={`rounded-lg bg-[var(--surface-2)] animate-pulse ${large ? 'h-80' : 'h-40'}`} />
  );
}
