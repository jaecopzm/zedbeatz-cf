export default function TrackLoading() {
  return (
    <div className="min-h-screen pb-6 animate-pulse">
      {/* Nav */}
      <div className="h-11 border-b border-[var(--border)] mb-0" />

      {/* Hero */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex gap-4 items-center mb-4">
          <div className="w-24 h-24 shrink-0 rounded-xl bg-[var(--glass-hover)]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-12 bg-[var(--glass-hover)] rounded" />
            <div className="h-5 w-48 bg-[var(--glass-hover)] rounded" />
            <div className="h-4 w-32 bg-[var(--glass-hover)] rounded" />
            <div className="h-3 w-40 bg-[var(--glass-hover)] rounded mt-1" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-[var(--glass-hover)] rounded-full" />
          <div className="h-9 w-9 bg-[var(--glass-hover)] rounded-full" />
          <div className="h-9 w-9 bg-[var(--glass-hover)] rounded-full" />
          <div className="h-9 w-9 bg-[var(--glass-hover)] rounded-full" />
          <div className="h-9 w-9 bg-[var(--glass-hover)] rounded-full" />
          <div className="ml-auto h-9 w-20 bg-[var(--glass-hover)] rounded-full" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-4 border-b border-[var(--border)] pb-2.5 mb-2">
        {["Lyrics", "Related", "Credits"].map((t) => (
          <div key={t} className="h-3 w-12 bg-[var(--glass-hover)] rounded" />
        ))}
      </div>

      {/* Content */}
      <div className="px-4">
        <div className="rounded-xl bg-[var(--glass-hover)] border border-[var(--border)] p-5 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 bg-[var(--glass-hover)] rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
