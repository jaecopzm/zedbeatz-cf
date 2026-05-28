"use client";

import Image from "next/image";
import { Play, Pause, Flame, MoreHorizontal } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import { TrackMenu } from "@/components/track-menu";

export default function TrendingSection({ tracks }: { tracks: Track[] }) {
  const { queue: pQueue, currentIndex, playing, setQueue, toggle } = usePlayer();

  if (!tracks || tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--surface)] text-center">
        <div className="w-12 h-12 bg-[var(--surface-2)] flex items-center justify-center mb-3">
          <Flame size={20} className="text-white/40" />
        </div>
        <h3 className="text-base font-bold mb-1 text-white">Nothing trending</h3>
        <p className="text-xs text-white/50">Check back later for hot tracks</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-3">
      {tracks.map((track, i) => (
        <TrendingCard key={track.id} track={track} index={i} tracks={tracks} />
      ))}
    </div>
  );
}

function TrendingCard({ track, index, tracks }: {
  track: Track; index: number; tracks: Track[];
}) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const isActive = queue[currentIndex]?.id === track.id;

  return (
    <div
      className="group relative flex items-center gap-2 md:gap-2.5 p-2 rounded-xl cursor-pointer transition-all duration-200 border-t border-[var(--border)]"
      onClick={() => isActive ? toggle() : setQueue(tracks, index)}
    >
      {/* Artwork */}
      <div className="relative w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-lg overflow-hidden bg-[var(--surface-3)] ring-1 ring-white/[0.04]">
        {track.coverUrl ? (
          <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)]" />
        )}

        {/* Hover play */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-200 ${
          isActive && playing ? "opacity-0" : "opacity-0 group-hover:opacity-100"
        }`}>
          {isActive && playing ? (
            <Pause size={12} className="text-white fill-white" />
          ) : (
            <Play size={12} className="text-white fill-white ml-0.5" />
          )}
        </div>

        {/* Now playing eq */}
        {isActive && playing && (
          <div className="absolute bottom-0.5 right-0.5 flex items-end gap-[1.5px] h-2.5">
            {[1,2,3].map((i) => (
              <span key={i} className="eq-bar eq-bar--active" style={{ animationDelay: `${i * 0.15}s`, height: `${3 + i * 2}px`, width: '2px' }} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`text-xs md:text-sm font-semibold line-clamp-2 leading-tight ${isActive ? "text-[var(--primary)]" : "text-white"}`}>
          {track.title}
        </p>
        <p className="text-[11px] md:text-xs text-white/40 truncate mt-0.5">{track.artist}</p>
      </div>

      {/* Duration */}
      {track.duration && (
        <span className="text-[10px] text-white/25 tabular-nums hidden md:block shrink-0">
          {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
        </span>
      )}

      {/* Menu */}
      <div className="-mr-1">
        <TrackMenu track={track} />
      </div>
    </div>
  );
}
