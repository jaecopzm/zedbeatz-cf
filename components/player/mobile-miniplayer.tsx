"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause } from "lucide-react";
import { MusicNote } from "@phosphor-icons/react";
import { usePlayer } from "@/lib/player-store";
import LikeButton from "@/components/like-button";

export default function MobileMiniplayer({
  onOpenFullscreen,
  progress,
  duration,
}: {
  onOpenFullscreen: () => void;
  progress: number;
  duration: number;
}) {
  const { queue, currentIndex, playing, toggle, next, prev } = usePlayer();
  const track = queue[currentIndex];
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  if (!track) return null;

  const handlePrev = () => {
    const audio = document.querySelector("audio");
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      prev();
    }
  };

  const haptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  return (
    <div className="md:hidden fixed left-0 right-0 z-50 px-4 bottom-[72px]" style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div
        onClick={onOpenFullscreen}
        role="button"
        tabIndex={0}
        aria-label={`Open ${track.title} by ${track.artist}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenFullscreen(); }
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          touchRef.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(e) => {
          const startX = touchRef.current?.x;
          const startY = touchRef.current?.y;
          touchRef.current = null;
          if (startX == null || startY == null) return;
          const dx = e.changedTouches[0].clientX - startX;
          const dy = e.changedTouches[0].clientY - startY;
          // Swipe up → open fullscreen
          if (dy < -40 && Math.abs(dy) > Math.abs(dx)) {
            e.preventDefault();
            onOpenFullscreen();
            return;
          }
          // Swipe left/right → skip tracks
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            e.preventDefault();
            if (dx < 0) next(); else handlePrev();
          }
        }}
        className="relative rounded-full overflow-hidden cursor-pointer active:scale-[0.98] transition-transform bg-[var(--surface-2)] ring-1 ring-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{
              width: `${(progress / (duration || 1)) * 100}%`
            }}
          />
        </div>

        <div className="relative flex items-center gap-2.5 pl-3.5 pr-2 py-2 pt-[10px]">
          {/* Album art */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded overflow-hidden bg-[var(--surface-3)]">
              {track.coverUrl ? (
                <Image src={track.coverUrl} alt={track.title} width={40} height={40} className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-[var(--surface-3)]" />
              )}
            </div>
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate leading-tight">{track.title}</p>
            <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
              {track.artist}
              {track.featuredArtists && (
                <span> ft. {track.featuredArtists}</span>
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <LikeButton trackId={track.id} size={16} />
            <button
              onClick={(e) => { e.stopPropagation(); haptic(); toggle(); }}
              aria-label={playing ? "Pause" : "Play"}
              className="w-9 h-9 rounded-full bg-[var(--primary)] text-black flex items-center justify-center active:scale-95 transition-transform"
            >
              {playing ? (
                <Pause size={15} fill="currentColor" />
              ) : (
                <Play size={15} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileMiniplayerIdle() {
  return (
    <div className="md:hidden fixed left-0 right-0 z-50 px-4 bottom-[72px]" style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <Link
        href="/tracks"
        className="relative rounded-full overflow-hidden active:scale-[0.98] transition-transform bg-[var(--surface-2)] ring-1 ring-white/10 flex items-center gap-2.5 pl-3.5 pr-2 py-2"
      >
        <div className="w-10 h-10 rounded overflow-hidden bg-[var(--surface-3)] flex items-center justify-center shrink-0">
          <MusicNote size={16} weight="bold" className="text-[var(--muted-2)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[var(--muted)] truncate leading-tight">Nothing playing</p>
          <p className="text-[11px] text-[var(--muted-2)] truncate mt-0.5">Tap to find music</p>
        </div>
      </Link>
    </div>
  );
}
