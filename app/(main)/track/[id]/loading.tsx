export default function TrackLoading() {
  return (
    <div className="min-h-screen pb-6 animate-pulse">
      {/* Nav */}
      <div className="h-11 border-b border-white/[0.06] mb-0" />

      {/* Hero */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex gap-4 items-center mb-4">
          <div className="w-24 h-24 shrink-0 rounded-xl bg-white/[0.07]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-12 bg-white/[0.05] rounded" />
            <div className="h-5 w-48 bg-white/[0.07] rounded" />
            <div className="h-4 w-32 bg-white/[0.05] rounded" />
            <div className="h-3 w-40 bg-white/[0.04] rounded mt-1" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-white/[0.07] rounded-full" />
          <div className="h-9 w-9 bg-white/[0.05] rounded-full" />
          <div className="h-9 w-9 bg-white/[0.05] rounded-full" />
          <div className="h-9 w-9 bg-white/[0.05] rounded-full" />
          <div className="h-9 w-9 bg-white/[0.05] rounded-full" />
          <div className="ml-auto h-9 w-20 bg-white/[0.05] rounded-full" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-4 border-b border-white/[0.08] pb-2.5 mb-2">
        {["Lyrics", "Related", "Credits"].map((t) => (
          <div key={t} className="h-3 w-12 bg-white/[0.05] rounded" />
        ))}
      </div>

      {/* Content */}
      <div className="px-4">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 bg-white/[0.04] rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
