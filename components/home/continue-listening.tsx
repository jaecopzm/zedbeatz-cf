"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Play, History } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import { motion, AnimatePresence } from "framer-motion";

interface LastPlayed {
  track: Track;
  currentTime: number;
  duration: number;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function ContinueListening() {
  const [lastPlayed, setLastPlayed] = useState<LastPlayed | null>(null);
  const { play, queue, currentIndex } = usePlayer();

  useEffect(() => {
    const saved = localStorage.getItem("zedbeatz-last-played");
    if (!saved) return;
    try {
      const data = JSON.parse(saved) as LastPlayed;
      // Don't show if already playing this track
      const currentTrack = queue[currentIndex];
      if (currentTrack && currentTrack.id === data.track.id) return;
      setLastPlayed(data);
    } catch {
      // ignore malformed data
    }
  }, [queue, currentIndex]);

  function handleResume() {
    if (!lastPlayed) return;
    sessionStorage.setItem("zedbeatz-resume-time", String(lastPlayed.currentTime));
    play(lastPlayed.track);
  }

  return (
    <AnimatePresence>
      {lastPlayed && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="px-4 md:px-8 mb-8"
        >
          <div
            onClick={handleResume}
            className="group relative flex items-center gap-4 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--glass-border)] hover:border-[var(--primary)]/30 rounded-2xl p-3 pr-4 cursor-pointer transition-all duration-300 hover:shadow-[0_4px_24px_rgba(30,215,96,0.1)]"
          >
            {/* Album art */}
            <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden">
              {lastPlayed.track.coverUrl ? (
                <Image
                  src={lastPlayed.track.coverUrl}
                  alt={lastPlayed.track.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center">
                  <History size={20} className="text-[var(--muted)]" />
                </div>
              )}
              {/* Progress overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                <div
                  className="h-full bg-[var(--primary)] transition-all"
                  style={{ width: `${(lastPlayed.currentTime / lastPlayed.duration) * 100}%` }}
                />
              </div>
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <History size={11} className="text-[var(--muted)] shrink-0" />
                <span className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">Continue Listening</span>
              </div>
              <p className="text-sm font-bold text-white truncate">{lastPlayed.track.title}</p>
              <p className="text-xs text-[var(--muted)] truncate">{lastPlayed.track.artist}</p>
            </div>

            {/* Time remaining */}
            <div className="shrink-0 text-right hidden sm:block">
              <p className="text-[10px] text-[var(--muted)] mb-1">
                {fmt(lastPlayed.currentTime)} / {fmt(lastPlayed.duration)}
              </p>
            </div>

            {/* Play button */}
            <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-black shadow-[0_0_20px_rgba(30,215,96,0.3)] group-hover:scale-105 transition-transform">
              <Play size={16} fill="currentColor" className="ml-0.5" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
