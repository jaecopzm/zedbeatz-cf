"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import LikeButton from "@/components/like-button";
import { useTheme } from "@/components/theme-provider";

function useDominantColor(src: string | undefined) {
  const { theme } = useTheme();
  const [color, setColor] = useState(theme === "light" ? "230,230,235" : "30,30,30");
  useEffect(() => {
    if (!src) return;
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 32, 32);
        const { data } = ctx.getImageData(0, 0, 32, 32);
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          const br = (data[i] + data[i+1] + data[i+2]) / 3;
          if (br < 20 || br > 235) continue;
          r += data[i]; g += data[i+1]; b += data[i+2]; count++;
        }
        if (count > 0) setColor(`${Math.round(r/count)},${Math.round(g/count)},${Math.round(b/count)}`);
      } catch {}
    };
  }, [src]);
  return color;
}

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
  const color = useDominantColor(track?.coverUrl);

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
    <div className="lg:hidden fixed left-0 right-0 z-50 px-1 bottom-[68px]" style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}>
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
        className="relative rounded-lg shadow-2xl overflow-hidden cursor-pointer active:scale-[0.98]"
        style={{ background: `linear-gradient(135deg, rgb(${color}) 0%, rgba(${color},0.95) 100%)`, transition: "background 0.8s ease" }}
      >
        {/* Permanent dark scrim for contrast */}
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--glass-hover)]">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{ 
              width: `${(progress / (duration || 1)) * 100}%` 
            }}
          />
        </div>
        
        <div className="relative flex items-center gap-2 px-2 py-2.5 pt-3">
          {/* Album art */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-md overflow-hidden bg-surface-2 shadow-lg">
              {track.coverUrl ? (
                <Image src={track.coverUrl} alt={track.title} width={40} height={40} className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)]" />
              )}
            </div>
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate leading-tight">{track.title}</p>
            <p className="text-[10px] text-foreground/60 truncate mt-0.5">
              {track.artist}
              {track.featuredArtists && (
                <span className="text-foreground/50"> ft. {track.featuredArtists}</span>
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            <LikeButton trackId={track.id} size={16} />
            <button
              onClick={(e) => { e.stopPropagation(); haptic(); toggle(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all hover:scale-105 relative"
              style={{ background: "rgba(255,255,255,0.9)", color: "#000" }}
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
