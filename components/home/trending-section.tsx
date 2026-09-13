"use client";

import Image from "next/image";
import { Play, Pause, Flame } from "@phosphor-icons/react";
import { usePlayer, type Track } from "@/lib/player-store";
import { TrackMenu } from "@/components/track-menu";

function fmtDuration(s?: number) {
  if (!s) return "";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function TrendingSection({ tracks }: { tracks: Track[] }) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();

  if (!tracks || tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-[4px] bg-[var(--surface)] text-center ring-1 ring-white/5">
        <div className="w-12 h-12 rounded-[4px] bg-[var(--surface-2)] flex items-center justify-center mb-3">
          <Flame size={20} weight="bold" className="text-foreground/40" />
        </div>
        <h3 className="text-base font-bold mb-1 text-foreground">No chart yet</h3>
        <p className="text-xs text-foreground/50">Plays this week will show up here</p>
      </div>
    );
  }

  const chunks: { track: Track; index: number }[][] = [[], []];
  tracks.forEach((track, i) => {
    chunks[i < 5 ? 0 : 1].push({ track, index: i });
  });

  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:pb-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:overflow-visible">
      {chunks.map((chunk, ci) => (
        <div key={ci} className="min-w-[78%] sm:min-w-[55%] lg:min-w-0 snap-start flex flex-col">
          {chunk.map(({ track, index: i }) => {
        const isActive = queue[currentIndex]?.id === track.id;
        const rank = String(i + 1).padStart(2, "0");
        return (
          <div
            key={track.id}
            onClick={() => (isActive ? toggle() : setQueue(tracks, i, { label: "Trending Now", href: "/tracks" }))}
            className={`group relative flex items-center gap-2.5 py-2 cursor-pointer transition-colors border-b border-white/[0.06] ${
              isActive ? "" : "hover:bg-white/[0.03]"
            }`}
          >
            <span
              className={`font-display text-sm md:text-base font-bold tabular-nums w-6 shrink-0 tracking-tight ${
                i < 3 ? "text-[var(--primary)]" : "text-foreground/30"
              }`}
            >
              {rank}
            </span>

            <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-[var(--surface-3)]">
              {track.coverUrl ? (
                <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="52px" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)]" />
              )}
              <div
                className={`absolute inset-0 bg-black/55 flex items-center justify-center transition-opacity ${
                  isActive && playing ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {isActive && playing ? (
                  <Pause size={16} weight="fill" className="text-white" />
                ) : (
                  <Play size={16} weight="fill" className="text-white ml-0.5" />
                )}
              </div>
              {isActive && playing && (
                <div className="absolute bottom-1 right-1 flex items-end gap-[2px]">
                  {[0, 1, 2].map((b) => (
                    <span
                      key={b}
                      className="eq-bar eq-bar--active"
                      style={{ animationDelay: `${b * 0.2}s`, height: `${5 + b * 3}px` }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className={`text-[13px] md:text-sm font-bold truncate leading-tight ${isActive ? "text-[var(--primary)]" : "text-foreground"}`}>
                {track.title}
              </p>
              <p className="text-[11px] md:text-xs text-[var(--muted)] truncate mt-0.5">
                {track.artist}
                {track.featuredArtists && <span> ft. {track.featuredArtists}</span>}
              </p>
            </div>

            <span className="text-[11px] text-[var(--muted-2)] tabular-nums hidden md:block shrink-0 w-10 text-right">
              {fmtDuration(track.duration)}
            </span>

            <div className="-mr-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <TrackMenu track={track} />
            </div>
          </div>
        );
          })}
        </div>
      ))}
    </div>
  );
}
