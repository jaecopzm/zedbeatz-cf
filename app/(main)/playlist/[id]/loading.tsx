import { ListMusic } from "lucide-react";

export default function PlaylistLoading() {
  return (
    <div className="pb-28">
      <div className="relative overflow-hidden mb-6">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/25 via-black to-black" />
        </div>

        <section className="relative px-4 md:px-8 pt-8 pb-6 flex flex-col sm:flex-row items-start sm:items-end gap-5 max-w-6xl mx-auto animate-pulse">
          <div className="w-36 h-36 md:w-48 md:h-48 overflow-hidden bg-[var(--glass-hover)] shrink-0 shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-[var(--border)] flex items-center justify-center">
            <ListMusic size={48} className="text-foreground/15" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="h-3 w-32 bg-[var(--glass-hover)] mb-3" />
            <div className="h-10 md:h-12 w-72 md:w-[520px] max-w-full bg-[var(--glass-hover)] mb-3" />
            <div className="h-4 w-40 bg-[var(--glass-hover)]" />
          </div>
        </section>
      </div>

      <section className="relative px-4 md:px-8 pb-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-12 w-28 bg-[var(--surface-2)]" />
          <div className="h-12 w-32 rounded-full bg-[var(--glass-hover)]" />
        </div>
      </section>

      <section className="relative px-2 sm:px-4 md:px-8 pb-12 max-w-6xl mx-auto">
        <div className="overflow-hidden">
          <div className="sticky top-0 z-10 grid grid-cols-[40px_1fr] sm:grid-cols-[56px_1fr_180px] gap-2 px-3 sm:px-6 py-2.5 sm:py-3 text-[11px] font-black uppercase tracking-widest text-foreground/40 border-b border-[var(--border)] bg-background/80 backdrop-blur-xl">
            <div className="text-center">#</div>
            <div>Title</div>
            <div className="hidden sm:block text-right pr-1">Artist</div>
          </div>

          <div className="divide-y divide-white/5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[40px_1fr] sm:grid-cols-[56px_1fr_180px] gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 items-center animate-pulse"
              >
                <div className="text-center">
                  <div className="h-4 w-6 mx-auto rounded bg-[var(--glass-hover)]" />
                </div>
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[var(--glass-hover)] ring-1 ring-[var(--border)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-56 max-w-full rounded bg-[var(--glass-hover)]" />
                    <div className="h-3 w-28 rounded bg-[var(--glass-hover)] mt-2" />
                  </div>
                </div>
                <div className="hidden sm:block text-right pr-1">
                  <div className="h-4 w-24 ml-auto rounded bg-[var(--glass-hover)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

