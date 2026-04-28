"use client";

import { useRef } from "react";
import Image from "next/image";
import { Play, Pause } from "lucide-react";
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
    <div className="lg:hidden fixed left-0 right-0 z-40 px-2 pb-2 mt-1" style={{ bottom: "calc(68px + env(safe-area-inset-bottom, 0px))" }}>
      <div
        onClick={onOpenFullscreen}
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
        className="relative bg-[#282828] rounded-lg shadow-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform backdrop-blur-xl"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{ 
              width: `${(progress / (duration || 1)) * 100}%` 
            }}
          />
        </div>
        
        <div className="flex items-center gap-2 px-2 py-1.5 pt-2">
          {/* Album art */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-md overflow-hidden bg-[#181818] shadow-lg">
              {track.coverUrl ? (
                <Image src={track.coverUrl} alt={track.title} width={40} height={40} className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#333] to-[#181818]" />
              )}
            </div>
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{track.title}</p>
            <p className="text-[10px] text-white/60 truncate mt-0.5">
              {track.artist}
              {track.featuredArtists && (
                <span className="text-white/50"> ft. {track.featuredArtists}</span>
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            <LikeButton trackId={track.id} size={16} />
            <button
              onClick={(e) => { e.stopPropagation(); haptic(); toggle(); }}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-lg active:scale-95 transition-all hover:scale-105 relative"
            >
              {playing ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
