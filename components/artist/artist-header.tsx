"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Pause, Shuffle, Music2, BarChart2, Disc3 } from "lucide-react";
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
    <div className={`flex flex-col items-center px-3 py-1.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl ${accent ? "bg-[var(--primary-dim)] border border-[var(--primary)]/30" : "bg-white/5 border border-white/10"}`}>
      <span className={`text-sm md:text-lg font-bold ${accent ? "text-[var(--primary)]" : "text-white"}`}>{value}</span>
      <span className="text-[9px] md:text-[11px] text-[var(--muted)] uppercase tracking-wider mt-0.5">{label}</span>
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
    <section className="relative mb-6 overflow-hidden">


      {/* Content */}
      <div className="relative px-4 md:px-10 pt-8 md:pt-12 pb-6 md:pb-10 flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-8">
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative shrink-0"
        >
          {/* Glow ring */}
          <div className={`absolute -inset-1.5 rounded-full bg-gradient-to-br from-[var(--primary)]/50 to-purple-500/30 blur-sm transition-opacity duration-700 ${isPlaying ? "opacity-100" : "opacity-0"}`} />
          <div className="relative w-32 h-32 md:w-52 md:h-52 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl">
            {artist.imageUrl ? (
              <Image src={artist.imageUrl} alt={artist.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--primary)]/80 to-purple-600 flex items-center justify-center text-4xl md:text-6xl font-extrabold text-white">
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
          className="flex-1 text-center md:text-left"
        >
          {/* Name */}
          <h1 className="text-3xl md:text-7xl font-extrabold tracking-tight mb-2 md:mb-3 leading-none">
            {artist.name}
          </h1>

          {/* Bio */}
          {artist.bio && (
            <p className="text-xs md:text-base text-white/60 mb-3 md:mb-5 max-w-xl leading-relaxed line-clamp-2 md:line-clamp-3 px-4 md:px-0">
              {artist.bio}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-4 md:mb-6 flex-wrap">
            <StatPill label="Tracks" value={artist.trackCount} />
            {artist.albumCount > 0 && <StatPill label="Albums" value={artist.albumCount} />}
            {artist.totalPlays > 0 && (
              <StatPill label="Plays" value={artist.totalPlays.toLocaleString()} accent />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 flex-wrap">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-5 py-2.5 md:px-7 md:py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-all hover:scale-105 active:scale-100 shadow-xl btn-primary-glow text-xs md:text-base"
            >
              {isPlaying
                ? <><Pause size={16} fill="currentColor" /> Pause</>
                : <><Play size={16} fill="currentColor" className="ml-0.5" /> Play All</>
              }
            </button>
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 md:gap-2 px-4 py-2.5 md:px-5 md:py-3.5 rounded-full glass-card hover:bg-white/15 text-white font-semibold transition-all hover:scale-105 active:scale-100 text-xs md:text-base"
            >
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
