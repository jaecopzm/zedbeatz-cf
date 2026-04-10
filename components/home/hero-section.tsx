"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, ChevronRight } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import { useState, useEffect } from "react";

export default function HeroSection({ tracks }: { tracks: Track[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { queue: pQueue, currentIndex: pIndex, playing, setQueue, toggle } = usePlayer();
  const track = tracks[currentIndex];
  const isActive = pQueue[pIndex]?.id === track?.id;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % tracks.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [tracks.length]);

  if (!track) return null;

  function handlePlay() {
    if (isActive) toggle();
    else setQueue(tracks, currentIndex);
  }

  return (
    <section className="relative h-[420px] md:h-[620px] mb-10 md:mb-14 overflow-hidden">
      {/* Background image */}
      <motion.div
        key={track.id}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0"
      >
        {track.coverUrl && (
          <Image src={track.coverUrl} alt={track.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
        )}
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/30 to-transparent" />

      {/* Ambient orbs */}
      <div className="absolute top-16 left-32 w-80 h-80 rounded-full blur-3xl animate-glow-pulse pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(30,215,96,0.15) 0%, transparent 70%)" }} />
      <div className="absolute bottom-10 right-24 w-64 h-64 rounded-full blur-3xl animate-glow-pulse pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)", animationDelay: "1.5s" }} />

      {/* Content */}
      <div className="relative h-full flex items-end px-4 md:px-10 pb-10 md:pb-14">
        <motion.div
          key={track.id}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="max-w-xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full glass-card border border-white/10 shadow-lg backdrop-blur-md mb-3 md:mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-white/80">Featured Track</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-3xl md:text-6xl lg:text-7xl font-bold mb-2 md:mb-3 leading-[1.05] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
          >
            {track.title}
          </motion.h1>

          {/* Artist */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex items-center gap-2 mb-5 md:mb-7"
          >
            <Link
              href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`}
              className="text-sm md:text-lg text-white/80 hover:text-white hover:underline transition-colors font-medium"
            >
              {track.artist}
            </Link>
            {track.featuredArtists && (
              <span className="text-sm md:text-lg text-white/50">feat. {track.featuredArtists}</span>
            )}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="flex items-center gap-2 md:gap-3"
          >
            <button
              onClick={handlePlay}
              className="group flex items-center gap-2 md:gap-2.5 px-5 md:px-7 py-2.5 md:py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-all hover:scale-105 active:scale-100 text-xs md:text-base btn-primary-glow"
            >
              {isActive && playing
                ? <Pause size={16} className="md:w-[18px] md:h-[18px]" fill="currentColor" />
                : <Play size={16} className="md:w-[18px] md:h-[18px] ml-0.5" fill="currentColor" />
              }
              {isActive && playing ? "Pause" : "Play Now"}
            </button>
            <Link
              href={track.slug ? `/track/${track.slug}` : `/track/${track.id}`}
              className="flex items-center gap-1 md:gap-1.5 px-4 md:px-6 py-2.5 md:py-3.5 rounded-full glass-card hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5 active:translate-y-0 text-white font-semibold transition-all duration-300 text-xs md:text-base border border-white/5"
            >
              Details <ChevronRight size={14} className="md:w-4 md:h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Carousel dots */}
      <div className="absolute bottom-4 md:bottom-5 right-4 md:right-10 flex items-center gap-2">
        {tracks.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "bg-[var(--primary)] w-5 md:w-6 h-1.5 md:h-2"
                : "bg-white/30 hover:bg-white/50 w-1.5 md:w-2 h-1.5 md:h-2"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
