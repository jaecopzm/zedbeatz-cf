export default function TrackCardSkeleton() {
  return (
    <div className="rounded-lg md:rounded-xl p-1.5 md:p-3 bg-[var(--surface)] animate-pulse">
      <div className="aspect-square rounded-md md:rounded-lg bg-[var(--surface-2)] mb-1.5 md:mb-3" />
      <div className="h-3 bg-[var(--surface-2)] rounded mb-1.5 w-4/5" />
      <div className="h-2.5 bg-[var(--surface-2)] rounded w-3/5" />
    </div>
  );
}
