"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Pause } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import { TrackMenu } from "@/components/track-menu";

export default function TracksListClient({ tracks, offset = 0 }: { tracks: Track[]; offset?: number }) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();

  return (
    <div className="px-2 md:px-4 py-1">
      {tracks.map((track, i) => {
        const isActive = queue[currentIndex]?.id === track.id;
        const num = offset + i + 1;

        return (
          <div
            key={track.id}
            onClick={() => isActive ? toggle() : setQueue(tracks, i)}
            className="group flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
          >
            {/* Number / play indicator */}
            <div className="w-7 shrink-0 text-center">
              <span className={`text-sm tabular-nums group-hover:hidden ${isActive ? "text-[var(--primary)] hidden" : "text-[var(--muted-2)]"}`}>{num}</span>
              <span className={`hidden group-hover:flex items-center justify-center ${isActive ? "flex" : ""}`}>
                {isActive && playing
                  ? <Pause size={14} className="text-[var(--primary)]" fill="currentColor" />
                  : <Play size={14} className="text-[var(--muted)]" fill="currentColor" />
                }
              </span>
            </div>

            {/* Art */}
            <div className="relative w-9 h-9 shrink-0 rounded-md overflow-hidden bg-[var(--surface-3)]">
              {track.coverUrl && <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="36px" />}
            </div>

            {/* Title + artist */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate leading-tight ${isActive ? "text-[var(--primary)]" : "text-foreground"}`}>
                {track.title}
              </p>
              <p className="text-xs text-[var(--muted)] truncate">
                {track.artistId
                  ? <Link href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`}
                      className="hover:underline hover:text-foreground transition-colors"
                      onClick={e => e.stopPropagation()}>
                      {track.artist}
                    </Link>
                  : track.artist
                }
                {track.featuredArtists && <span className="text-[var(--muted-2)]"> feat. {track.featuredArtists}</span>}
              </p>
            </div>

            {/* Duration */}
            {track.duration && (
              <span className="text-xs text-[var(--muted-2)] tabular-nums hidden sm:block shrink-0">
                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")}
              </span>
            )}

            {/* Menu */}
            <div onClick={e => e.stopPropagation()}>
              <TrackMenu track={track} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
