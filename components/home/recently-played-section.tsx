'use client';

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Clock, Play, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";

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
      <div className="flex items-center gap-3 md:gap-4 p-3 md:p-5 glass-card border border-white/5">
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
      <div className="flex flex-col items-center justify-center p-8 glass-card border border-white/5 text-center">
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
      <div className="flex items-center gap-4 p-5 glass-card border border-white/5">
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
    <div className="flex flex-col">
      {tracks.slice(0, 6).map((track, i) => {
        const isActive = pQueue[currentIndex]?.id === track.id;
        return (
          <div
            key={track.id}
            onClick={() => isActive ? toggle() : setQueue(tracks, i, { label: "Recently Played" })}
            className={`group flex items-center gap-2.5 px-2 py-1.5 cursor-pointer transition-colors ${
              isActive ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
            }`}
          >
            <span className="text-xs text-[var(--muted-2)] w-4 text-center shrink-0 tabular-nums">{i + 1}</span>

            <div className="relative w-9 h-9 shrink-0 bg-[var(--surface-3)]">
              {track.coverUrl && <Image src={track.coverUrl} alt={track.title} fill className="object-cover" unoptimized />}
              {isActive && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  {playing ? (
                    <div className="flex items-end gap-[2px] h-3">
                      {[1,2,3].map(n => <span key={n} className="eq-bar eq-bar--active" style={{ animationDelay: `${n * 0.15}s` }} />)}
                    </div>
                  ) : <Play size={14} className="text-white ml-0.5" fill="currentColor" />}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${isActive ? "text-[var(--primary)]" : "text-white"}`}>{track.title}</p>
              <p className="text-[10px] text-[var(--muted)] truncate">{track.artist}</p>
            </div>

            {track.duration && (
              <span className="text-[10px] text-[var(--muted)] tabular-nums shrink-0">
                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
