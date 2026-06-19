"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Mic2,
  List,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  MoreHorizontal,
  Download,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import LikeButton from "@/components/like-button";
import ShareButton from "@/components/share-button";
import DownloadButton from "@/components/download-button";
import LyricsView from "./lyrics-view";
import { TrackMenu } from "@/components/track-menu";
import type { Track } from "@/lib/player-store";
import type { PlayContext } from "@/lib/player-store";
import { useEffect, useRef, useState, useMemo } from "react";
import { useTheme } from "@/components/theme-provider";

interface MobileNowPlayingProps {
  track: Track;
  queue: Track[];
  currentIndex: number;
  playing: boolean;
  loading: boolean;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  volume: number;
  progress: number;
  duration: number;
  frequencyData: Uint8Array;
  showLyrics: boolean;
  showQueue: boolean;
  context: PlayContext | null;
  onClose: () => void;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleMute: () => void;
  onVolumeChange: (v: number) => void;
  onProgressChange: (v: number) => void;
  onToggleLyrics: () => void;
  onToggleQueue: () => void;
  onSelectTrack: (index: number) => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function MobileNowPlaying({
  track,
  queue,
  currentIndex,
  playing,
  loading,
  shuffle,
  repeat,
  volume,
  progress,
  duration,
  frequencyData,
  showLyrics,
  showQueue,
  context,
  onClose,
  onToggle,
  onNext,
  onPrev,
  onToggleShuffle,
  onCycleRepeat,
  onToggleMute,
  onVolumeChange,
  onProgressChange,
  onToggleLyrics,
  onToggleQueue,
  onSelectTrack,
}: MobileNowPlayingProps) {
  const progressPercent = duration ? (progress / duration) * 100 : 0;
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const touchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { theme } = useTheme();
  const isLight = useMemo(() => theme === "light", [theme]);

  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const bgColor = isLight ? "#f5f5f7" : "#000";
  const queueBg = isLight ? "#e8e8ee" : "#111";
  const blurOverlay = isLight
    ? "linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.95) 100%)"
    : "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.9) 100%)";
  const artworkShadow = isLight
    ? playing
      ? "0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)"
      : "0 12px 40px rgba(0,0,0,0.1)"
    : playing
      ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)"
      : "0 12px 40px rgba(0,0,0,0.5)";

  const c = (alpha: number) => isLight ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
  const cb = (alpha: number) => isLight ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;

  return (
    <div
      className="lg:hidden flex flex-col h-full relative overflow-hidden"
      style={{ background: bgColor }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        setIsTransitioning(false);
      }}
      onTouchMove={(e) => {
        if (!touchRef.current) return;
        const dx = e.touches[0].clientX - touchRef.current.x;
        const dy = e.touches[0].clientY - touchRef.current.y;
        // Only track horizontal swipes
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          setSwipeOffset(dx);
        }
      }}
      onTouchEnd={(e) => {
        if (!touchRef.current) return;
        const dx = e.changedTouches[0].clientX - touchRef.current.x;
        const dy = e.changedTouches[0].clientY - touchRef.current.y;
        const dt = Date.now() - touchRef.current.time;
        const velocity = Math.abs(dx) / dt;
        
        touchRef.current = null;
        setIsTransitioning(true);
        
        // Swipe down to close
        if (dy > 80 && Math.abs(dy) > Math.abs(dx)) { 
          setSwipeOffset(0);
          onClose(); 
          return; 
        }
        
        // Swipe left/right for next/prev (lower threshold, consider velocity)
        if ((Math.abs(dx) > 50 || velocity > 0.3) && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) {
            onNext();
          } else {
            onPrev();
          }
        }
        
        // Reset offset
        setTimeout(() => setSwipeOffset(0), 300);
      }}
    >
      {/* Dynamic blurred cover background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {track.coverUrl && (
          <>
            <div
              key={track.coverUrl}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${track.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: `blur(60px) saturate(250%) brightness(${isLight ? 1.2 : 0.5})`,
                transform: "scale(1.4)",
              }}
            />
            <div className="absolute inset-0" style={{ background: blurOverlay }} />
          </>
        )}
      </div>

      {/* ── HEADER ── */}
      <div
        className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2 shrink-0"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        {/* Chevron down pill */}
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
          style={{ background: c(0.08) }}
        >
          <ChevronDown size={22} className="text-foreground" strokeWidth={2.5} />
        </button>

        {/* Center label with subtle pill */}
        <div
          className="flex flex-col items-center gap-0.5 cursor-default"
          onClick={onToggleLyrics}
        >
          <span
            className={`text-[11px] font-semibold truncate max-w-[180px] ${!context ? "uppercase tracking-[0.18em]" : ""}`}
            style={{ color: c(0.55) }}
          >
            {showLyrics ? "Lyrics" : context ? (
              context.href ? (
                <Link href={context.href} onClick={onClose} className="hover:text-foreground/80 transition-colors">
                  Playing from {context.label}
                </Link>
              ) : (
                <>Playing from {context.label}</>
              )
            ) : "Now Playing"}
          </span>
          {/* Tiny drag indicator */}
          <div
            className="w-8 h-0.5 rounded-full"
            style={{ background: c(0.2) }}
          />
        </div>

        {/* Track menu */}
        <div className="flex items-center justify-center w-10 h-10">
          <TrackMenu track={track} onNavigate={onClose} />
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden relative z-10"
        style={{
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          scrollbarWidth: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>

        <div className="flex flex-col items-center px-6 pt-3 pb-4 gap-5">
          {/* ── CONTENT AREA (ARTWORK / LYRICS / QUEUE) ── */}
          <div className="w-full relative" style={{ aspectRatio: "1/1" }}>
            {showLyrics ? (
                <div
                  key="lyrics"
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{
                    background: c(0.04),
                    border: `1px solid ${c(0.08)}`,
                  }}
                >
                  <LyricsView
                    trackId={track.id}
                    progress={progress}
                    className="w-full h-full"
                  />
                </div>
              ) : showQueue ? (
                <div
                  key="queue"
                  className="absolute inset-0 overflow-hidden flex flex-col"
                  style={{ background: queueBg }}
                >
                  <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                    <span className="text-sm font-bold text-foreground">Up Next</span>
                    <span className="text-xs text-foreground/40">{queue.length} tracks</span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {queue.map((t, i) => (
                      <button
                        key={`${t.id}-${i}`}
                        onClick={() => onSelectTrack(i)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-[var(--border)] ${
                          i === currentIndex ? "bg-[var(--glass-hover)]" : "active:bg-[var(--glass-hover)]"
                        }`}
                      >
                        <span className={`text-xs w-5 text-center shrink-0 tabular-nums ${i === currentIndex ? "text-[#1ed760]" : "text-foreground/30"}`}>
                          {i + 1}
                        </span>
                        <div className="relative w-10 h-10 shrink-0 bg-[var(--glass-hover)]">
                          {t.coverUrl && (
                            <Image src={t.coverUrl} alt="" fill className="object-cover" unoptimized />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`text-sm font-semibold truncate ${i === currentIndex ? "text-[#1ed760]" : "text-foreground"}`}>
                            {t.title}
                          </p>
                          <p className="text-xs text-foreground/50 truncate">{t.artist}</p>
                        </div>
                        {i === currentIndex && playing && (
                          <span className="eq-container shrink-0" aria-hidden>
                            {[0.3, 0.7, 0.5].map((delay, i) => (
                              <span key={i} className="eq-bar eq-bar--active" style={{ animationDelay: `${delay}s` }} />
                            ))}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div key="artwork" className="relative w-full h-full" onTouchEnd={(e) => {
                  const t = touchRef.current;
                  if (!t) return;
                  const dy = e.changedTouches[0].clientY - t.y;
                  if (dy < -60 && Math.abs(dy) > Math.abs(e.changedTouches[0].clientX - t.x)) {
                    e.stopPropagation();
                    onToggleQueue();
                  }
                }}>
                  {/* Cover art */}
                  <div
                    className="relative w-full h-full overflow-hidden rounded"
                    style={{
                      transform: `scale(${playing ? 1 : 0.93}) translateX(${swipeOffset * 0.5}px)`,
                      opacity: Math.max(0.3, 1 - Math.abs(swipeOffset) / 400),
                      transition: isTransitioning ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease" : "transform 0.1s ease-out, opacity 0.1s ease-out",
                      boxShadow: artworkShadow,
                    }}
                  >
                    {track.coverUrl ? (
                      <Image
                        src={track.coverUrl}
                        alt={track.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 448px"
                        className="object-cover"
                        priority
                        unoptimized
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: isLight ? "linear-gradient(135deg, #ddd 0%, #eee 100%)" : "linear-gradient(135deg, #2a2a2a 0%, #111 100%)" }}
                      />
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* ── TRACK INFO + LIKE ── */}
          <div className="w-full flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1
                className="font-bold text-foreground leading-tight truncate"
                style={{ fontSize: "clamp(1.15rem, 5vw, 1.4rem)" }}
              >
                {track.title}
              </h1>
              <Link
                href={
                  track.artistSlug
                    ? `/artist/${track.artistSlug}`
                    : `/artist/${track.artistId}`
                }
                className="mt-0.5 text-sm font-medium block truncate transition-colors"
                style={{ color: c(0.6) }}
                onClick={onClose}
              >
                {track.artist}
                {track.featuredArtists && (
                  <span style={{ color: c(0.35) }}>
                    {" "}
                    · feat. {track.featuredArtists}
                  </span>
                )}
              </Link>
            </div>

            {/* Like button with scale animation */}
            <div
              className="shrink-0 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <LikeButton trackId={track.id} size={22} />
            </div>
          </div>

          {/* ── PROGRESS BAR ── */}
          <div className="w-full space-y-2">
            {/* Custom slim progress track */}
            <div className="relative" style={{ height: 36 }}>
              <Slider
                value={[progress]}
                max={duration || 1}
                step={0.1}
                onValueChange={([v]: number[]) => onProgressChange(v)}
                onPointerDown={() => setIsDragging(true)}
                onPointerUp={() => setIsDragging(false)}
                className="absolute inset-y-0 w-full"
                style={
                  {
                    "--slider-track-height": isDragging ? "6px" : "4px",
                    "--slider-thumb-size": isDragging ? "16px" : "0px",
                    transition: "all 0.15s ease",
                  } as React.CSSProperties
                }
              />
            </div>

            <div
              className="flex justify-between font-medium tabular-nums"
              style={{ fontSize: 11, color: c(0.45) }}
            >
              <span>{fmt(progress)}</span>
              <span>-{fmt(Math.max(0, duration - progress))}</span>
            </div>
          </div>

          {/* ── TRANSPORT CONTROLS ── */}
          <div className="flex items-center justify-between w-full px-1">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              className="relative flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90"
              style={{ color: shuffle ? "#1ed760" : c(0.45) }}
            >
              <Shuffle size={21} strokeWidth={2} />
              {shuffle && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "#1ed760" }}
                />
              )}
            </button>

            {/* Skip back */}
            <button
              onClick={onPrev}
              className="flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-90"
              style={{ color: c(0.85) }}
            >
              <SkipBack size={34} fill="currentColor" strokeWidth={0} />
            </button>

            {/* Play / Pause CTA */}
            <button
              onClick={onToggle}
              className="relative flex items-center justify-center rounded-full transition-all active:scale-95 hover:scale-105"
              style={{
                width: 68,
                height: 68,
                background: "#fff",
                boxShadow: isLight
                  ? "0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)"
                  : "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.1)",
              }}
            >
              {loading ? (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full"
                  style={{ background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.6)" }}
                >
                  <div
                    className="w-6 h-6 rounded-full animate-spin"
                    style={{
                      border: "2.5px solid rgba(0,0,0,0.12)",
                      borderTopColor: "#000",
                    }}
                  />
                </div>
              ) : playing ? (
                <Pause
                  size={28}
                  fill="#000"
                  strokeWidth={0}
                  className="text-black"
                />
              ) : (
                <Play
                  size={28}
                  fill="#000"
                  strokeWidth={0}
                  className="text-black ml-0.5"
                />
              )}
            </button>

            {/* Skip forward */}
            <button
              onClick={onNext}
              className="flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-90"
              style={{ color: c(0.85) }}
            >
              <SkipForward size={34} fill="currentColor" strokeWidth={0} />
            </button>

            {/* Repeat */}
            <button
              onClick={onCycleRepeat}
              className="relative flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90"
              style={{
                color: repeat !== "off" ? "#1ed760" : c(0.45),
              }}
            >
              {repeat === "one" ? (
                <Repeat1 size={21} strokeWidth={2} />
              ) : (
                <Repeat size={21} strokeWidth={2} />
              )}
              {repeat !== "off" && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "#1ed760" }}
                />
              )}
            </button>
          </div>

          {/* ── SECONDARY ACTIONS BAR ── */}
          <div className="w-full flex items-center justify-between px-1 pt-1">
            {/* Volume group */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                className="transition-all active:scale-90"
                style={{ color: c(0.45) }}
              >
                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div style={{ width: 72 }}>
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.01}
                  onValueChange={([v]: number[]) => onVolumeChange(v)}
                />
              </div>
            </div>

            {/* Right action cluster */}
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ActionPill bg={cb(0.07)}>
                <button
                  onClick={onToggleQueue}
                  className="transition-all active:scale-90"
                  style={{ color: showQueue ? "#1ed760" : c(0.6) }}
                >
                  <List size={18} />
                </button>
              </ActionPill>
              <ActionPill bg={cb(0.07)}>
                <DownloadButton
                  audioUrl={track.audioUrl}
                  title={track.title}
                  artist={track.artist}
                  featuredArtists={track.featuredArtists}
                  coverUrl={track.coverUrl}
                />
              </ActionPill>
              <ActionPill bg={cb(0.07)}>
                <ShareButton
                  title={`${track.title} by ${track.artist}`}
                  url={`${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/track/${track.slug || track.id}`}
                />
              </ActionPill>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Subtle pill wrapper for icon action buttons */
function ActionPill({ children, bg }: { children: React.ReactNode; bg?: string }) {
  return (
    <div
      className="flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-90"
      style={{ background: bg ?? "rgba(255,255,255,0.07)" }}
    >
      {children}
    </div>
  );
}