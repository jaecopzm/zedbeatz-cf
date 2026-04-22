"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import LikeButton from "@/components/like-button";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function PopularTracks({
  tracks,
  allTracks,
}: {
  tracks: (Track & { plays?: number })[];
  allTracks: Track[];
}) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();

  return (
    <section className="px-4 md:px-10 mb-10 md:mb-14">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5 md:mb-7">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-orange-500 to-amber-400 shrink-0" />
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Popular</h2>
      </div>

      <div className="flex flex-col gap-1.5">
        {tracks.map((track, i) => {
          const isActive = queue[currentIndex]?.id === track.id;

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              onClick={() =>
                isActive
                  ? toggle()
                  : setQueue(allTracks, allTracks.findIndex((t) => t.id === track.id))
              }
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                isActive
                  ? "bg-[var(--surface-2)] ring-1 ring-[var(--primary)]/30"
                  : "hover:bg-[var(--surface-2)]"
              }`}
            >
              {/* Rank number */}
              <span className={`text-xs font-bold w-4 text-center shrink-0 tabular-nums ${isActive ? "text-[var(--primary)]" : "text-[var(--muted-2)]"}`}>
                {i + 1}
              </span>

              {/* Album art */}
              <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-md">
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-[var(--surface-3)] flex items-center justify-center">
                    <span className="text-lg opacity-20">♪</span>
                  </div>
                )}
                {/* Active overlay */}
                {isActive && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-end gap-[2px] h-4">
                      {[1, 2, 3].map(n => (
                        <span key={n} className="eq-bar" style={{ animationDelay: `${n * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate leading-tight ${isActive ? "text-[var(--primary)]" : "text-white"}`}>
                  {track.title}
                </p>
                <p className="text-xs text-[var(--muted)] truncate block mt-0.5">
                  {track.featuredArtists ? `feat. ${track.featuredArtists}` : ""}
                  {track.featuredArtists && track.plays && track.plays > 0 ? " · " : ""}
                  {track.plays && track.plays > 0 ? `${track.plays.toLocaleString()} plays` : "No plays yet"}
                </p>
              </div>

              {/* Duration */}
              {track.duration && (
                <span className="text-[11px] text-[var(--muted)] tabular-nums shrink-0 font-medium">
                  {fmt(track.duration)}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LikeButton trackId={track.id} size={16} />
                </div>
                {/* Play button (hover / active) */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive && playing
                    ? "bg-[var(--primary)] text-black scale-105 shadow-[var(--glow-primary)]"
                    : "bg-white/0 text-[var(--muted)] group-hover:bg-white/10 group-hover:text-white"
                }`}>
                  {isActive && playing
                    ? <Pause size={13} fill="currentColor" />
                    : <Play size={13} fill="currentColor" className="ml-0.5" />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
