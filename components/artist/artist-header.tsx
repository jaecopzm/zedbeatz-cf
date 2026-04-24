"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Play, Pause, Shuffle } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

type Artist = {
  id: number;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  slug: string | null;
  trackCount: number;
  albumCount: number;
  totalPlays: number;
};

function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`flex flex-col items-center px-4 py-2 md:px-5 md:py-3 rounded-xl glass-card backdrop-blur-md border ${accent ? "border-[var(--primary)]/30 bg-[var(--primary)]/10" : "border-white/10 bg-black/40"}`}>
      <span className={`text-sm md:text-lg font-bold ${accent ? "text-[var(--primary)]" : "text-white"}`}>{value}</span>
      <span className="text-[10px] md:text-xs text-white/50 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

export default function ArtistHeader({ artist, tracks }: { artist: Artist; tracks: Track[] }) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const isPlaying = queue.length > 0 && queue[0]?.artistId === artist.id && playing;

  function handlePlay() {
    if (isPlaying) toggle();
    else setQueue(tracks, 0);
  }

  function handleShuffle() {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0);
  }

  return (
    <section className="relative mb-6 md:mb-10 overflow-hidden" style={{ minHeight: "380px" }}>
      {/* Ambient Full-bleed Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={artist.id + "-bg"}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          {artist.imageUrl && (
            <Image
              src={artist.imageUrl}
              alt={artist.name}
              fill
              sizes="100vw"
              className="object-cover opacity-40 blur-[80px] scale-[1.2]"
              priority
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/40 via-[#0a0a0f]/60 to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content */}
      <div className="absolute inset-0 z-10 px-4 md:px-10 pb-8 md:pb-12 flex flex-row items-end gap-5 md:gap-10">
        {/* Avatar with spinning conic gradient ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative shrink-0 group w-24 h-24 md:w-56 md:h-56"
        >
          {/* Spinning ring */}
          <div className={`absolute -inset-2 rounded-full transition-opacity duration-700 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            style={{
              background: "conic-gradient(from 0deg, var(--primary), #a855f7, #3b82f6, var(--primary))",
              animation: "spin-ring 4s linear infinite",
            }}
          />
          <div className="absolute inset-0 rounded-full bg-[var(--background)] scale-[0.96]" />
          <div className="relative w-24 h-24 md:w-56 md:h-56 rounded-full overflow-hidden shadow-2xl border-[3px] border-black">
            {artist.imageUrl ? (
              <Image
                src={artist.imageUrl}
                alt={artist.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center text-5xl md:text-7xl font-extrabold text-[var(--muted)]/50">
                {artist.name[0]}
              </div>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="flex-1 min-w-0 text-left flex flex-col items-start"
        >
          {/* Name */}
          <h1 className="text-2xl md:text-6xl lg:text-7xl font-black tracking-tight mb-2 md:mb-4 leading-[1.05] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            {artist.name}
          </h1>

          {/* Bio */}
          {artist.bio && (
            <p className="text-sm md:text-base text-white/70 mb-5 max-w-2xl leading-relaxed line-clamp-2 px-4 md:px-0">
              {artist.bio}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <StatPill label="Tracks" value={artist.trackCount} />
            {artist.albumCount > 0 && <StatPill label="Albums" value={artist.albumCount} />}
            {artist.totalPlays > 0 && (
              <StatPill label="Total Plays" value={artist.totalPlays.toLocaleString()} accent />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handlePlay}
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-all hover:scale-105 active:scale-100 text-sm md:text-base shadow-[0_4px_20px_rgba(30,215,96,0.35)] btn-primary-glow"
            >
              {isPlaying
                ? <><Pause size={18} fill="currentColor" /> Pause</>
                : <><Play size={18} fill="currentColor" className="ml-0.5" /> Play All</>
              }
            </button>
            <button
              onClick={handleShuffle}
              className="flex items-center gap-2 px-6 py-3.5 rounded-full glass-card hover:bg-white/10 text-white font-semibold border border-white/10 transition-all hover:scale-105 active:scale-100 text-sm md:text-base"
            >
              <Shuffle size={16} /> Shuffle
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
