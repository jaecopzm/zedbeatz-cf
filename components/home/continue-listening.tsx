"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Play, Pause } from "@phosphor-icons/react";
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
  const remaining = lastPlayed.duration > 0 ? Math.max(0, lastPlayed.duration - lastPlayed.currentTime) : 0;
  const remainingLabel = remaining > 0
    ? `${Math.floor(remaining / 60)}:${String(Math.floor(remaining % 60)).padStart(2, "0")} left`
    : null;

  return (
    <div
      onClick={handleClick}
      className="relative flex items-center gap-3 rounded bg-white/[0.04] hover:bg-white/[0.07] ring-1 ring-white/[0.05] pl-1.5 pr-1.5 py-1.5 cursor-pointer transition-colors mb-5 w-full overflow-hidden"
    >
      {/* Art */}
      <div className="relative w-11 h-11 shrink-0 rounded overflow-hidden bg-[var(--surface-3)]">
        {lastPlayed.track.coverUrl
          ? <Image src={lastPlayed.track.coverUrl} alt={lastPlayed.track.title} fill className="object-cover" unoptimized />
          : <div className="w-full h-full bg-[var(--surface-3)]" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[var(--muted)] font-medium leading-none mb-1">Pick up where you left off</p>
        <p className="text-[13px] font-bold truncate text-foreground leading-tight">
          {lastPlayed.track.title}
          <span className="font-medium text-[var(--muted)]"> · {lastPlayed.track.artist}</span>
        </p>
      </div>

      {remainingLabel && (
        <span className="hidden sm:block text-[11px] tabular-nums text-[var(--muted)] shrink-0">{remainingLabel}</span>
      )}

      {/* Play/Pause */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-black hover:brightness-110 transition-all">
        {isActive && playing
          ? <Pause size={14} weight="fill" />
          : <Play size={14} weight="fill" className="ml-0.5" />
        }
      </div>

      {/* Progress — hairline, full width */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.08]">
        <div className="h-full bg-[var(--primary)]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
