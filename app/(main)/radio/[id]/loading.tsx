import { Radio, Music2 } from "lucide-react";

export default function RadioLoading() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/25 via-black to-black" />
      </div>

      <section className="relative px-4 sm:px-6 md:px-8 pt-6 pb-6 md:pb-8 max-w-6xl mx-auto">
        <div className="flex items-start gap-5 sm:gap-6 animate-pulse">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 shrink-0 overflow-hidden bg-[var(--glass-hover)] ring-1 ring-[var(--border)] shadow-2xl flex items-center justify-center">
            <Music2 className="w-10 h-10 text-foreground/15" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="h-3 w-20 bg-[var(--glass-hover)] mb-3" />
            <div className="h-10 sm:h-12 w-64 sm:w-96 max-w-full bg-[var(--glass-hover)]" />
            <div className="h-4 w-56 sm:w-80 max-w-full bg-[var(--glass-hover)] mt-4" />
            <div className="flex items-center gap-3 mt-6">
              <div className="h-12 w-28 bg-[var(--surface-2)]" />
              <div className="h-12 w-24 bg-[var(--glass-hover)]" />
              <div className="ml-auto h-12 w-24 bg-[var(--glass-hover)]" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-2 sm:px-4 md:px-6 pb-10 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--glass-hover)] backdrop-blur-xl overflow-hidden">
          <div className="grid grid-cols-[48px_1fr_140px] sm:grid-cols-[56px_1fr_180px] gap-2 px-4 sm:px-6 py-3 text-[11px] font-black uppercase tracking-widest text-foreground/40 border-b border-[var(--border)]">
            <div className="text-center">#</div>
            <div>Title</div>
            <div className="text-right pr-1">Artist</div>
          </div>

          <div className="divide-y divide-white/5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[48px_1fr_140px] sm:grid-cols-[56px_1fr_180px] gap-2 px-4 sm:px-6 py-3.5 items-center animate-pulse"
              >
                <div className="text-center">
                  <div className="h-4 w-6 mx-auto rounded bg-[var(--glass-hover)]" />
                </div>
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--glass-hover)] ring-1 ring-[var(--border)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-56 max-w-full rounded bg-[var(--glass-hover)]" />
                    <div className="h-3 w-28 rounded bg-[var(--glass-hover)] mt-2" />
                  </div>
                </div>
                <div className="text-right pr-1">
                  <div className="h-4 w-24 ml-auto rounded bg-[var(--glass-hover)]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-foreground/40 font-semibold px-2 sm:px-0">
          <Radio className="w-4 h-4" />
          Building your station…
        </div>
      </section>
    </div>
  );
}

