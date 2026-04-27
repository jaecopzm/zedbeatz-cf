"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import { useState, useEffect, useRef, useCallback } from "react";

const INTERVAL = 8000;

export default function HeroSection({ tracks }: { tracks: Track[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const { queue: pQueue, currentIndex: pIndex, playing, setQueue, toggle } = usePlayer();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const track = tracks[currentIndex];
  const isActive = pQueue[pIndex]?.id === track?.id;

  const goTo = useCallback((i: number) => {
    setCurrentIndex(i);
    setProgressKey(k => k + 1);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % tracks.length);
      setProgressKey(k => k + 1);
    }, INTERVAL);
  }, [tracks.length]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % tracks.length);
      setProgressKey(k => k + 1);
    }, INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tracks.length]);

  if (!track || tracks.length === 0) {
    return (
      <section className="relative overflow-hidden mb-6 md:mb-10 rounded-[2rem] glass-card border border-white/5 flex flex-col items-center justify-center text-center p-8 md:p-16" style={{ minHeight: "460px" }}>
        <div className="w-20 h-20 rounded-full bg-[var(--surface-3)] flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/20 to-transparent opacity-50" />
          <Play size={32} className="text-[var(--muted)] ml-2 relative z-10" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black mb-3 text-white">Ready to Play</h2>
        <p className="text-[var(--muted)] max-w-md text-sm md:text-base">
          We're having trouble reaching our servers. Check your connection to see the latest hits, or play your downloaded tracks from your Library.
        </p>
      </section>
    );
  }

  function handlePlay() {
    if (isActive) toggle();
    else setQueue(tracks, currentIndex);
  }

  return (
    <section className="relative overflow-hidden mb-6 md:mb-10" style={{ minHeight: "460px" }}>
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="animate-ambient absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
          style={{ background: "radial-gradient(circle, #1ed760 0%, transparent 70%)" }}
        />
        <div
          className="animate-ambient absolute -bottom-10 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-15"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)", animationDelay: "4s" }}
        />
      </div>

      {/* Full-bleed background image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={track.id + "-bg"}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {track.coverUrl && (
            <Image
              src={track.coverUrl}
              alt={track.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
              unoptimized
            />
          )}
          {/* Multi-layer gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-[#0a0a0f]/30 md:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/40" />
        </motion.div>
      </AnimatePresence>

      {/* Auto-progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 z-10">
        <div
          key={progressKey}
          className="h-full bg-[var(--primary)] origin-left"
          style={{ animation: `hero-progress ${INTERVAL}ms linear forwards` }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full" style={{ minHeight: "460px" }}>
        {/* Featured Track Badge - top on mobile, inside content on desktop */}
        <AnimatePresence mode="wait">
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute top-4 left-4 md:hidden"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              <span className="text-[10px] text-[var(--muted)]">{currentIndex + 1} / {tracks.length}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-10 left-4 right-4 md:bottom-14 md:left-10 md:right-10 md:flex md:flex-row md:items-end md:gap-0">

        {/* ── Left: text + controls ── */}
        <div className="flex-1 max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Badge - desktop only */}
              <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-white/10 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                <span className="text-[10px] text-[var(--muted)]">{currentIndex + 1} / {tracks.length}</span>
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-3xl lg:text-4xl font-black mb-2 leading-[1.1] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
                {track.title}
              </h2>

              {/* Artist */}
              <div className="flex items-center gap-2 mb-6">
                <Link
                  href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`}
                  className="text-sm md:text-base text-white/70 hover:text-white transition-colors font-semibold"
                >
                  {track.artist}
                </Link>
                {track.featuredArtists && (
                  <span className="text-sm text-white/40">feat. {track.featuredArtists}</span>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={handlePlay}
                  className="group flex items-center gap-2.5 px-6 py-3 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-all hover:scale-105 active:scale-100 text-sm btn-primary-glow shadow-[0_4px_20px_rgba(30,215,96,0.35)]"
                >
                  {isActive && playing
                    ? <Pause size={16} fill="currentColor" />
                    : <Play size={16} fill="currentColor" className="ml-0.5" />
                  }
                  {isActive && playing ? "Pause" : "Play Now"}
                </button>
                <Link
                  href={track.slug ? `/track/${track.slug}` : `/track/${track.id}`}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-full glass-card hover:bg-white/[0.08] border border-white/10 text-white font-semibold transition-all text-sm hover:-translate-y-0.5"
                >
                  Details <ArrowRight size={14} />
                </Link>
              </div>

              {/* Thumbnail strip */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goTo((currentIndex - 1 + tracks.length) % tracks.length)}
                  className="w-7 h-7 rounded-full glass-card border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
                  aria-label="Previous track"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="flex gap-2 overflow-hidden">
                  {tracks.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => goTo(i)}
                      className={`relative shrink-0 rounded-lg overflow-hidden transition-all duration-300 ${
                        i === currentIndex
                          ? "w-14 h-14 md:w-16 md:h-16 ring-2 ring-[var(--primary)] shadow-[0_0_12px_rgba(30,215,96,0.4)]"
                          : "w-10 h-10 md:w-12 md:h-12 opacity-50 hover:opacity-80"
                      }`}
                      aria-label={`Go to ${t.title}`}
                    >
                      {t.coverUrl ? (
                        <Image src={t.coverUrl} alt={t.title} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full bg-[var(--surface-3)]" />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => goTo((currentIndex + 1) % tracks.length)}
                  className="w-7 h-7 rounded-full glass-card border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
                  aria-label="Next track"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Right: Large album art with vinyl effect (desktop only) ── */}
        <div className="hidden lg:flex items-center justify-center shrink-0 ml-auto pr-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={track.id + "-art"}
              initial={{ opacity: 0, scale: 0.88, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.7, ease: [0.34, 1.1, 0.64, 1] }}
              className="relative"
            >
              {/* Vinyl record behind art */}
              <div
                className={`absolute inset-0 rounded-full scale-[1.18] -translate-x-8 bg-[#111] shadow-2xl ${isActive && playing ? "animate-vinyl-spin" : ""}`}
                style={{
                  background: "repeating-radial-gradient(circle, #1a1a1a 0px, #111 3px, #1a1a1a 4px)",
                }}
              >
                <div className="absolute inset-0 rounded-full" style={{
                  background: "conic-gradient(from 0deg, rgba(30,215,96,0.15), transparent 40%, rgba(168,85,247,0.1), transparent 80%)",
                }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#222] border-2 border-[#333]" />
              </div>

              {/* Album art */}
              <div className="relative w-[280px] h-[280px] xl:w-[320px] xl:h-[320px] rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} fill className="object-cover" priority unoptimized />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center">
                    <span className="text-6xl opacity-20">♪</span>
                  </div>
                )}
                {/* Shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
              </div>

              {/* Active glow ring */}
              {isActive && playing && (
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[var(--primary)]/60 shadow-[0_0_40px_rgba(30,215,96,0.3)] pointer-events-none" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        </div>
      </div>
    </section>
  );
}
