"use client";

import { Play, Pause } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";
import AddToPlaylist from "@/components/add-to-playlist";
import LikeButton from "@/components/like-button";
import { parseFeaturedArtists, getArtistSlugFromName } from "@/lib/featured-artists";

export default function TrackRow({ track, queue, index }: { track: Track; queue?: Track[]; index?: number }) {
  const { queue: pQueue, currentIndex, playing, loading, setQueue, play, toggle } = usePlayer();
  const isActive = pQueue[currentIndex]?.id === track.id;

  function handlePlay() {
    if (isActive) { toggle(); return; }
    if (queue) {
      const idx = queue.findIndex((t) => t.id === track.id);
      setQueue(queue, idx >= 0 ? idx : 0);
    } else {
      play(track);
    }
  }

  return (
    <div
      onClick={handlePlay}
      className={`group flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 ${
        isActive
          ? "bg-[var(--surface-2)] ring-1 ring-[var(--primary)]/20"
          : "hover:bg-[var(--surface-2)]"
      }`}
    >
      {/* Index / equalizer */}
      {index !== undefined && (
        <div className="text-[var(--muted)] text-sm w-6 shrink-0 flex items-center justify-center">
          {isActive && playing ? (
            <div className="flex items-end gap-[2px] h-4">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="eq-bar"
                  style={{ animationDelay: `${i * 0.15}s`, height: `${5 + i * 2}px` }}
                />
              ))}
            </div>
          ) : (
            <>
              <span className="group-hover:hidden tabular-nums">{index}</span>
              <Play size={14} className="hidden group-hover:block fill-current" />
            </>
          )}
        </div>
      )}

      {/* Cover */}
      <div className="relative w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-[var(--surface-3)] shadow-sm">
        {track.coverUrl ? (
          <Image src={track.coverUrl} alt={track.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)]" />
        )}
        {isActive && loading && (
          <div className="absolute inset-0 rounded-lg ring-2 ring-[var(--primary)] ring-offset-0 animate-pulse" />
        )}
      </div>

      {/* Title / artist */}
      <div className="flex flex-col flex-1 min-w-0">
        <Link
          href={track.slug ? `/track/${track.slug}` : `/track/${track.id}`}
          onClick={(e) => e.stopPropagation()}
          className={`text-sm font-semibold truncate transition-colors hover:underline ${isActive ? "text-[var(--primary)]" : "text-white"}`}
        >
          {track.title}
        </Link>
        <div className="text-xs text-[var(--muted)] truncate">
          {track.artistId ? (
            <>
              <Link
                href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-white hover:underline transition-colors"
              >
                {track.artist}
              </Link>
              {track.featuredArtists && (
                <span className="text-[var(--muted)]">
                  {" feat. "}{track.featuredArtists}
                </span>
              )}
            </>
          ) : (
            <span>{track.artist}{track.featuredArtists && ` feat. ${track.featuredArtists}`}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <LikeButton trackId={track.id} size={14} />
        <AddToPlaylist trackId={track.id} />
      </div>
    </div>
  );
}
