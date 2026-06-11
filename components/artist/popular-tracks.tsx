"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Pause, GripVertical } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

export default function PopularTracks({
  tracks,
  allTracks,
}: {
  tracks: Track[];
  allTracks: Track[];
}) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();

  function formatDuration(seconds?: number) {
    if (!seconds) return "--";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function formatPlays(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  }

  return (
    <section className="px-4 md:px-10 mb-8" id="popular-panel" role="tabpanel">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl md:text-[26px] font-black tracking-tight">Popular</h2>
        {tracks.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-[11px] font-semibold text-[var(--muted)]">
            Top {tracks.length}
          </span>
        )}
      </div>

      {/* Table header - desktop only */}
      <div className="hidden md:grid grid-cols-[40px_1fr_100px_80px] gap-3 px-3 py-2 border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
        <span className="text-center">#</span>
        <span>Title</span>
        <span className="text-right">Plays</span>
        <span className="text-right">Duration</span>
      </div>

      <div className="flex flex-col">
        {tracks.map((track, i) => {
          const isActive = queue[currentIndex]?.id === track.id;
          const trackIndex = allTracks.findIndex((t) => t.id === track.id);

          return (
            <div
              key={track.id}
              onClick={() =>
                isActive
                  ? toggle()
                  : setQueue(allTracks, trackIndex >= 0 ? trackIndex : i)
              }
              className={`group grid grid-cols-[40px_1fr_100px_80px] md:grid-cols-[40px_1fr_100px_80px] gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all items-center ${
                isActive
                  ? "bg-[var(--surface)]"
                  : "hover:bg-[var(--surface)]"
              }`}
            >
              {/* Track number / play button */}
              <div className="flex items-center justify-center">
                <span className="text-sm tabular-nums text-[var(--muted)] group-hover:hidden">
                  {i + 1}
                </span>
                <div
                  className={`hidden group-hover:flex w-6 h-6 rounded-full bg-[var(--primary)] items-center justify-center transition-all scale-90 group-hover:scale-100 ${
                    isActive ? "flex" : "hidden"
                  }`}
                >
                  {isActive && playing ? (
                    <Pause size={10} fill="currentColor" className="text-black" />
                  ) : (
                    <Play size={10} fill="currentColor" className="text-black ml-0.5" />
                  )}
                </div>
                {isActive && playing && (
                  <div className="hidden md:group-hover:hidden flex items-end gap-[1.5px] h-4">
                    {[1, 2, 3].map((b) => (
                      <span
                        key={b}
                        className="eq-bar eq-bar--active"
                        style={{ animationDelay: `${b * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[var(--surface-3)] md:hidden">
                  {track.coverUrl && (
                    <Image src={track.coverUrl} alt={track.title} fill className="object-cover" unoptimized />
                  )}
                  {isActive && playing && (
                    <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                      <span className="eq-container">
                        {[0.3, 0.7, 0.5].map((delay, b) => (
                          <span key={b} className="eq-bar eq-bar--active" style={{ animationDelay: `${delay}s` }} />
                        ))}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={track.slug ? `/track/${track.slug}` : `/track/${track.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-sm font-semibold truncate block hover:underline ${
                      isActive ? "text-[var(--primary)]" : "text-foreground"
                    }`}
                  >
                    {track.title}
                  </Link>
                  {track.featuredArtists && (
                    <p className="text-xs text-[var(--muted)] truncate">feat. {track.featuredArtists}</p>
                  )}
                </div>
              </div>

              {/* Plays */}
              <div className="text-right text-xs text-[var(--muted)] tabular-nums hidden md:block">
                {track.plays ? formatPlays(track.plays) : "--"}
              </div>

              {/* Duration */}
              <div className="text-right text-xs text-[var(--muted)] tabular-nums hidden md:block">
                {formatDuration(track.duration)}
              </div>

              {/* Mobile duration */}
              <div className="md:hidden text-right text-xs text-[var(--muted)] tabular-nums">
                {formatDuration(track.duration)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
