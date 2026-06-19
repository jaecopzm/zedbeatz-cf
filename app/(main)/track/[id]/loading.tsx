export default function TrackLoading() {
  return (
    <div className="min-h-screen pb-32 animate-pulse" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <div className="sticky top-0 z-40 h-12 backdrop-blur-[40px]" style={{ borderBottom: "0.5px solid var(--border)" }} />

      {/* Hero — centered like Apple Music */}
      <div className="px-5 pt-8 pb-6 w-full">
        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl bg-[var(--glass-hover)]" />
          <div className="max-w-md space-y-3">
            <div className="h-3 w-16 mx-auto bg-[var(--glass-hover)] rounded" />
            <div className="h-7 w-56 mx-auto bg-[var(--glass-hover)] rounded" />
            <div className="h-5 w-40 mx-auto bg-[var(--glass-hover)] rounded" />
            <div className="h-3 w-48 mx-auto bg-[var(--glass-hover)] rounded" />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="h-11 w-28 bg-[var(--glass-hover)] rounded-full" />
            <div className="h-10 w-10 bg-[var(--glass-hover)] rounded-full" />
            <div className="h-10 w-10 bg-[var(--glass-hover)] rounded-full" />
            <div className="h-10 w-10 bg-[var(--glass-hover)] rounded-full" />
            <div className="h-10 w-10 bg-[var(--glass-hover)] rounded-full" />
            <div className="h-9 w-20 bg-[var(--glass-hover)] rounded-full" />
          </div>
        </div>
      </div>

      {/* Pill tabs */}
      <div className="px-5 w-full mb-5">
        <div className="flex p-1 rounded-xl w-fit mx-auto gap-1 bg-[var(--glass-hover)]">
          {["Lyrics", "Related", "Credits"].map((t) => (
            <div key={t} className="h-8 w-20 bg-[var(--surface-2)] rounded-lg" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="px-5 w-full mb-6">
        <div className="rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--glass-hover)" }}>
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-3 bg-[var(--surface-2)] rounded" style={{ width: `${60 + (i % 4) * 10}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Up next skeleton */}
      <div className="px-5 w-full mb-6">
        <div className="h-4 w-24 bg-[var(--glass-hover)] rounded mb-3" />
        <div className="rounded-2xl border divide-y" style={{ borderColor: "var(--border)", background: "var(--glass-hover)" }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-4 h-4 bg-[var(--surface-2)] rounded" />
              <div className="w-9 h-9 bg-[var(--surface-2)] rounded-md" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-[var(--surface-2)] rounded" />
                <div className="h-2.5 w-20 bg-[var(--surface-2)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
