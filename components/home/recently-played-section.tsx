'use client';

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Clock, Play, Pause, LogIn, Music } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";
import { motion } from "framer-motion";

export default function RecentlyPlayedSection() {
  const { isSignedIn, isLoaded } = useUser();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { queue: pQueue, currentIndex, playing, setQueue, toggle } = usePlayer();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setLoading(false); setTracks([]); return; }
    setLoading(true);
    fetch("/api/recently-played/list")
      .then(r => {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.json();
      })
      .then(data => { setTracks(Array.isArray(data.tracks) ? data.tracks : []); setError(false); })
      .catch(() => { setTracks([]); setError(true); })
      .finally(() => setLoading(false));
  }, [isSignedIn, isLoaded]);

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl shimmer-wave h-16" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-2xl glass-card border border-white/5">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--accent-blue-dim)] flex items-center justify-center shrink-0">
          <LogIn size={18} className="text-[var(--accent-blue)] md:w-5 md:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-semibold">Sign in to see your history</p>
          <p className="text-[10px] md:text-xs text-[var(--muted)] mt-0.5 hidden sm:block">Your recently played tracks will appear here</p>
        </div>
        <Link href="/sign-in" className="shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-[var(--primary)] text-black text-[10px] md:text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl glass-card border border-white/5 text-center">
        <Clock size={24} className="text-[var(--muted)] mb-3 opacity-50" />
        <p className="text-sm font-bold text-white mb-1">Couldn't load history</p>
        <p className="text-xs text-[var(--muted)] max-w-xs">
          You appear to be offline. Please check your connection to sync your listening history.
        </p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex items-center gap-4 p-5 rounded-2xl glass-card border border-white/5">
        <div className="w-12 h-12 rounded-full bg-[var(--surface-3)] flex items-center justify-center shrink-0">
          <Clock size={20} className="text-[var(--muted)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">No tracks played yet</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Start listening to build your history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {tracks.slice(0, 6).map((track, i) => {
        const isActive = pQueue[currentIndex]?.id === track.id;
        return (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            onClick={() => isActive ? toggle() : setQueue(tracks, i)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
              isActive
                ? "bg-[var(--surface-2)] ring-1 ring-[var(--primary)]/30"
                : "hover:bg-[var(--surface-2)]"
            }`}
          >
            {/* Rank number */}
            <span className="text-xs font-bold text-[var(--muted-2)] w-4 text-center shrink-0 tabular-nums">
              {i + 1}
            </span>

            {/* Album art */}
            <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-md">
              {/* Fallback background with Music icon */}
              <div className="absolute inset-0 bg-[var(--surface-3)] flex items-center justify-center -z-10">
                <Music size={18} className="opacity-30 text-white" />
              </div>

              {track.coverUrl && (
                <Image src={track.coverUrl} alt={track.title} fill className="object-cover" unoptimized />
              )}
              {/* Active overlay */}
              {isActive && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="flex items-end gap-[2px] h-4">
                    {[1, 2, 3].map(n => (
                      <span key={n} className="eq-bar" style={{ animationDelay: `${n * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate leading-tight ${isActive ? "text-[var(--primary)]" : "text-white"}`}>
                {track.title}
              </p>
              <Link
                href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId ?? ""}`}
                onClick={e => e.stopPropagation()}
                className="text-xs text-[var(--muted)] hover:text-white transition-colors truncate block mt-0.5"
              >
                {track.artist}
              </Link>
            </div>

            {/* Duration */}
            {track.duration && (
              <span className="text-[11px] text-[var(--muted)] tabular-nums shrink-0">
                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")}
              </span>
            )}

            {/* Play button (hover / active) */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
              isActive && playing
                ? "bg-[var(--primary)] text-black scale-105 shadow-[var(--glow-primary)]"
                : "bg-white/0 text-[var(--muted)] group-hover:bg-white/10 group-hover:text-white"
            }`}>
              {isActive && playing
                ? <Pause size={13} fill="currentColor" />
                : <Play size={13} fill="currentColor" className="ml-0.5" />}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
