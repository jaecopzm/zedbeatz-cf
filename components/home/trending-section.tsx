"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, TrendingUp, Flame } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

export default function TrendingSection({ tracks }: { tracks: Track[] }) {
  const { queue: pQueue, currentIndex, playing, setQueue, toggle } = usePlayer();

  return (
    <div className="relative">
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {tracks.map((track, i) => {
          const isActive = pQueue[currentIndex]?.id === track.id;
          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group relative flex-shrink-0 w-[200px] md:w-[300px] snap-start"
            >
              <div className={`relative h-[136px] md:h-[176px] rounded-xl md:rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${
                isActive ? "ring-2 ring-[var(--primary)]/60 shadow-[0_0_20px_rgba(30,215,96,0.15)] scale-[0.98]" : ""
              }`}>
                {/* Cover */}
                {track.coverUrl ? (
                  <Image
                    src={track.coverUrl}
                    alt={track.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)]" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Rank badge */}
                <div className={`absolute top-2 md:top-3 left-2 md:left-3 w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-sm shadow-lg ${
                  i === 0 ? "bg-yellow-400 text-black" :
                  i === 1 ? "bg-slate-300 text-black" :
                  i === 2 ? "bg-amber-700 text-white" :
                  "bg-black/60 backdrop-blur-sm text-white"
                }`}>
                  {i + 1}
                </div>

                {/* Hot badge */}
                <div className="absolute top-2 md:top-3 right-2 md:right-3 flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-orange-500/90 backdrop-blur-sm text-white">
                  <Flame size={9} className="md:w-[10px] md:h-[10px]" />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase">Hot</span>
                </div>

                {/* Play button */}
                <button
                  onClick={() => isActive ? toggle() : setQueue(tracks, i)}
                  className={`absolute bottom-2 md:bottom-3 right-2 md:right-3 w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isActive
                      ? "bg-[var(--primary)] opacity-100 translate-y-0 shadow-[var(--glow-primary)] scale-105"
                      : "bg-white/90 backdrop-blur opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-4 md:group-hover:translate-y-0 hover:scale-110 hover:bg-white"
                  }`}
                >
                  {isActive && playing
                    ? <Pause size={16} className="md:w-[18px] md:h-[18px] text-black" fill="currentColor" />
                    : <Play size={16} className="md:w-[18px] md:h-[18px] ml-0.5 text-black" fill="currentColor" />
                  }
                </button>
              </div>

              <Link href={track.slug ? `/track/${track.slug}` : `/track/${track.id}`} className="block mt-2 md:mt-3">
                <p className={`text-xs md:text-sm font-semibold truncate hover:underline transition-colors ${isActive ? "text-[var(--primary)]" : "text-white"}`}>
                  {track.title}
                </p>
                <p className="text-[10px] md:text-xs text-[var(--muted)] truncate mt-0.5">{track.artist}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Fade edges */}
      <div className="absolute top-0 left-0 bottom-4 w-6 bg-gradient-to-r from-[var(--background)] to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
    </div>
  );
}
