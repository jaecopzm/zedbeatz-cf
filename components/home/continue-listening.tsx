"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Play, Pause, History } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

interface LastPlayed { track: Track; currentTime: number; duration: number; }

export default function ContinueListening() {
  const [lastPlayed, setLastPlayed] = useState<LastPlayed | null>(null);
  const { play, toggle, queue, currentIndex, playing } = usePlayer();

  const currentTrack = queue[currentIndex];
  const isActive = currentTrack?.id === lastPlayed?.track.id;

  useEffect(() => {
    const saved = localStorage.getItem("zedbeatz-last-played");
    if (!saved) return;
    try { setLastPlayed(JSON.parse(saved) as LastPlayed); } catch {}
  }, []);

  // Hide if this track is already queued and no progress saved
  if (!lastPlayed) return null;

  function handleClick() {
    if (!lastPlayed) return;
    if (isActive) {
      toggle();
    } else {
      sessionStorage.setItem("zedbeatz-resume-time", String(lastPlayed.currentTime));
      play(lastPlayed.track);
    }
  }

  const progress = lastPlayed.duration > 0 ? (lastPlayed.currentTime / lastPlayed.duration) * 100 : 0;

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] rounded-lg p-2.5 cursor-pointer transition-colors mb-6 w-full"
    >
      {/* Art */}
      <div className="relative w-11 h-11 shrink-0 rounded-md overflow-hidden">
        {lastPlayed.track.coverUrl
          ? <Image src={lastPlayed.track.coverUrl} alt={lastPlayed.track.title} fill className="object-cover" unoptimized />
          : <div className="w-full h-full bg-[var(--surface-3)]" />
        }
        {/* Progress bar on art */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/30">
          <div className="h-full bg-[var(--primary)]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <History size={10} className="text-[var(--muted)] shrink-0" />
          <span className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">Continue listening</span>
        </div>
        <p className="text-sm font-bold truncate text-foreground">{lastPlayed.track.title}</p>
        <p className="text-xs text-[var(--muted)] truncate">{lastPlayed.track.artist}</p>
      </div>

      {/* Play/Pause */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-black">
        {isActive && playing
          ? <Pause size={15} fill="currentColor" />
          : <Play size={15} fill="currentColor" className="ml-0.5" />
        }
      </div>
    </div>
  );
}
