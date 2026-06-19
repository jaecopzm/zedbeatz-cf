"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Pause } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import { TrackMenu } from "@/components/track-menu";

interface TrackListItemProps {
  track: Track;
  tracks: Track[];
  index: number;
}

export default function TrackListItem({ track, tracks, index }: TrackListItemProps) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const isActive = queue[currentIndex]?.id === track.id;

  return (
    <div
      className="group relative flex items-center gap-2 md:gap-2.5 px-3 py-2 cursor-pointer transition-all duration-200 border-b border-[var(--border)] hover:bg-[var(--surface-hover)]"
      onClick={() => isActive ? toggle() : setQueue(tracks, index)}
    >
      {/* Artwork */}
      <div className="relative w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-md overflow-hidden bg-[var(--surface-3)]">
        {track.coverUrl ? (
          <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)]" />
        )}

        {/* Hover play */}
        <div className={`absolute inset-0 bg-background/50 flex items-center justify-center transition-all duration-200 ${
          isActive && playing ? "opacity-0" : "opacity-0 group-hover:opacity-100"
        }`}>
          {isActive && playing ? (
            <Pause size={12} className="text-foreground" fill="currentColor" />
          ) : (
            <Play size={12} className="text-foreground ml-0.5" fill="currentColor" />
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
        <p className={`text-xs md:text-sm font-semibold line-clamp-2 leading-tight ${isActive ? "text-[var(--primary)]" : "text-foreground"}`}>
          {track.title}
        </p>
        <p className="text-[11px] md:text-xs text-[var(--muted)] truncate mt-0.5">{track.artist}</p>
      </div>

      {/* Duration */}
      {track.duration && (
        <span className="text-[10px] text-[var(--muted-2)] tabular-nums hidden md:block shrink-0">
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
