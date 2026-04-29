"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

export default function QuickPlaySection({ tracks }: { tracks: Track[] }) {
  const { queue: pQueue, currentIndex, playing, setQueue, toggle } = usePlayer();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
      {tracks.map((track, i) => {
        const isActive = pQueue[currentIndex]?.id === track.id;

        return (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            onClick={() => isActive ? toggle() : setQueue(tracks, i, { label: "Quick Play" })}
            className={`group relative overflow-hidden border transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${
              isActive
                ? "border-[var(--primary)]/40 bg-[var(--surface-2)] shadow-[0_0_15px_rgba(30,215,96,0.1)]"
                : "border-[var(--glass-border)] glass-card hover:bg-white/[0.03] hover:border-white/10"
            }`}
          >
            {/* Active animated border */}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "linear-gradient(90deg, var(--primary), #10b981, var(--primary))",
                  backgroundSize: "200% 100%",
                  opacity: 0.15,
                }}
                animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            )}

            <div className="relative flex items-center gap-2.5 md:gap-3.5 p-2.5 md:p-3.5 z-10">
              {/* Cover */}
              <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl overflow-hidden shrink-0 shadow-lg">
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs md:text-sm font-semibold truncate leading-tight ${isActive ? "text-[var(--primary)]" : "text-white"}`}>
                  {track.title}
                </p>
                <p className="text-[10px] md:text-xs text-[var(--muted)] truncate mt-0.5">{track.artist}</p>
              </div>

              {/* Play button */}
              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md shrink-0 ${
                isActive && playing
                  ? "bg-[var(--primary)] text-black shadow-[var(--glow-primary)] scale-105"
                  : "bg-white/10 text-white backdrop-blur-md border border-white/10 group-hover:bg-white group-hover:text-black group-hover:scale-110 group-hover:border-transparent"
              }`}>
                {isActive && playing
                  ? <Pause size={14} className="md:w-4 md:h-4" fill="currentColor" />
                  : <Play size={14} className="md:w-4 md:h-4 ml-0.5" fill="currentColor" />
                }
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
