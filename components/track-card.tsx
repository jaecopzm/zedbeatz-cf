"use client";

import { useState } from "react";
import { Play, Pause, X, Music } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";
import AddToPlaylist from "@/components/add-to-playlist";
import LikeButton from "@/components/like-button";
import { useLongPress } from "@/lib/use-long-press";

export default function TrackCard({ track, queue, bare }: { track: Track; queue?: Track[]; bare?: boolean }) {
  const { queue: pQueue, currentIndex, playing, loading, setQueue, play, toggle } = usePlayer();
  const isActive = pQueue[currentIndex]?.id === track.id;
  const [showActions, setShowActions] = useState(false);

  const longPress = useLongPress(() => setShowActions(true));

  function handlePlay() {
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isActive) { toggle(); return; }
    if (queue) {
      const idx = queue.findIndex((t) => t.id === track.id);
      setQueue(queue, idx >= 0 ? idx : 0);
    } else {
      play(track);
    }
  }

  const isNew = track.createdAt
    ? Date.now() - new Date(track.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <>
      {/* Long-press quick actions sheet (mobile) */}
      {showActions && (
        <div className="sm:hidden fixed inset-0 z-[200]" onClick={() => setShowActions(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute bottom-0 left-0 right-0 bg-[var(--surface)] rounded-t-2xl p-4 pb-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-3"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
              {track.coverUrl && <Image src={track.coverUrl} alt={track.title} width={44} height={44} className="rounded-lg object-cover" />}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{track.title}</p>
                <p className="text-xs text-[var(--muted)] truncate">{track.artist}</p>
              </div>
              <button onClick={() => setShowActions(false)} className="ml-auto p-1 text-[var(--muted)]"><X size={18} /></button>
            </div>
            <div className="flex justify-around py-2">
              <div onClick={() => setShowActions(false)}><LikeButton trackId={track.id} size={20} /></div>
              <div onClick={() => setShowActions(false)}><AddToPlaylist trackId={track.id} /></div>
            </div>
          </div>
        </div>
      )}

    <div
      {...longPress}
      onClick={handlePlay}
      className={`group cursor-pointer transition-all duration-300 relative overflow-hidden ${
        bare
          ? "rounded-none bg-transparent p-0"
          : `rounded-lg md:rounded-xl p-1.5 md:p-3 ${
              isActive
                ? "bg-[var(--surface-2)] ring-1 ring-[var(--primary)]/30"
                : "bg-[var(--surface)] hover:bg-[var(--surface-2)]"
            }`
      }`}
      style={!bare ? { boxShadow: isActive ? "var(--shadow-card), 0 0 20px rgba(30,215,96,0.08)" : "var(--shadow-card)" } : undefined}
    >
      {/* Subtle top gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />

      {/* Cover art */}
      <div className={`relative aspect-square overflow-hidden mb-1.5 md:mb-2.5 bg-[var(--surface-2)] shadow-lg ${
        bare
          ? "rounded-xl ring-1 ring-white/5 group-hover:ring-[var(--primary)]/40 group-hover:shadow-[0_8px_30px_rgba(30,215,96,0.15)]"
          : "rounded-md md:rounded-lg shadow-md"
      } transition-all duration-400`}>
        {/* Fallback background with Music icon */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center -z-10">
          <Music size={24} className="opacity-20 text-white md:w-8 md:h-8" />
        </div>

        {track.coverUrl && (
          <Image
            src={track.coverUrl}
            alt={track.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* New badge */}
        {isNew && (
          <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-black text-[8px] md:text-[9px] font-black uppercase tracking-wider leading-none">
            New
          </div>
        )}

        {/* Playing equalizer indicator */}
        {isActive && playing && (
          <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 flex items-end gap-[2px] md:gap-[3px] h-3 md:h-4 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 md:px-2 md:py-1">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className="eq-bar"
                style={{ animationDelay: `${i * 0.15}s`, height: `${4 + i * 2}px` }}
              />
            ))}
          </div>
        )}

        {/* Duration badge */}
        {track.duration && !isActive && (
          <div className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] md:text-[10px] font-medium text-white/90 tabular-nums">
            {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
          </div>
        )}

        {/* Loading indicator */}
        {isActive && loading && (
          <div className="absolute inset-0 rounded-md md:rounded-lg ring-2 ring-[var(--primary)] animate-pulse pointer-events-none" />
        )}

        {/* Hover overlay with play button */}
        <div className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300 ${
          isActive && playing ? "opacity-0 md:group-hover:opacity-100" : "opacity-0 md:group-hover:opacity-100"
        }`}>
          <div className="relative w-9 h-9 md:w-12 md:h-12 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-xl shadow-[var(--primary-glow)] transition-all duration-200 scale-90 group-hover:scale-100 hover:bg-[var(--primary-hover)]">
            {isActive && playing ? (
              <Pause size={16} className="text-black fill-black md:w-5 md:h-5" />
            ) : (
              <Play size={16} className="text-black fill-black ml-0.5 md:w-5 md:h-5" />
            )}
          </div>
        </div>

        {/* Action buttons row — desktop only */}
        <div
          className="hidden md:flex absolute bottom-2 right-2 gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
          onClick={(e) => e.stopPropagation()}
        >
          <LikeButton trackId={track.id} size={12} />
          <AddToPlaylist trackId={track.id} />
        </div>
      </div>

      {/* Text */}
      <Link
        href={track.slug ? `/track/${track.slug}` : `/track/${track.id}`}
        onClick={(e) => e.stopPropagation()}
        className={`text-[10px] md:text-sm font-semibold truncate mb-0.5 transition-colors block hover:underline ${isActive ? "text-[var(--primary)]" : "text-white"}`}
      >
        {track.title}
      </Link>
      {track.artistId ? (
        <div className="text-[9px] md:text-xs text-[var(--muted)] truncate">
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
        </div>
      ) : (
        <p className="text-[9px] md:text-xs text-[var(--muted)] truncate">
          {track.artist}{track.featuredArtists && ` feat. ${track.featuredArtists}`}
        </p>
      )}
      {track.duration && (
        <p className="text-[8px] md:text-[10px] text-[var(--muted)]/60 tabular-nums mt-0.5">
          {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")}
        </p>
      )}
    </div>
    </>
  );
}
