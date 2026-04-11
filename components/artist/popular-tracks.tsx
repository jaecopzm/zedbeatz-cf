"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Pause, TrendingUp } from "lucide-react";
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
    <section className="px-4 md:px-10 mb-10 md:mb-12">
      {/* Section header */}
      <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[var(--primary-dim)] flex items-center justify-center">
          <TrendingUp size={15} className="text-[var(--primary)] md:w-[17px] md:h-[17px]" />
        </div>
        <h2 className="text-lg md:text-2xl font-bold tracking-tight">Popular</h2>
      </div>

      <div className="space-y-0.5 md:space-y-1">
        {tracks.map((track, i) => {
          const isActive = queue[currentIndex]?.id === track.id;

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              onClick={() =>
                isActive
                  ? toggle()
                  : setQueue(allTracks, allTracks.findIndex((t) => t.id === track.id))
              }
              className={`group flex items-center gap-2.5 md:gap-4 px-2 py-2 md:px-3 md:py-3 rounded-lg md:rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[var(--surface-2)] ring-1 ring-[var(--primary)]/20"
                  : "hover:bg-[var(--surface-2)]"
              }`}
            >
              {/* Rank / equalizer */}
              <div className="w-5 md:w-7 shrink-0 flex items-center justify-center">
                {isActive && playing ? (
                  <div className="flex items-end gap-[2px] md:gap-[3px] h-3 md:h-4">
                    {[1, 2, 3].map((b) => (
                      <span
                        key={b}
                        className="eq-bar"
                        style={{ animationDelay: `${b * 0.15}s`, height: `${4 + b * 2}px` }}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <span className={`text-xs md:text-base font-bold tabular-nums group-hover:hidden ${isActive ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>
                      {i + 1}
                    </span>
                    <Play size={12} className="hidden group-hover:block text-white fill-white md:w-[14px] md:h-[14px]" />
                  </>
                )}
              </div>

              {/* Cover */}
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl overflow-hidden shrink-0 shadow-sm bg-[var(--surface-2)]">
                {track.coverUrl && (
                  <Image src={track.coverUrl} alt={track.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" unoptimized />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs md:text-sm font-semibold truncate transition-colors ${isActive ? "text-[var(--primary)]" : "text-white"}`}>
                  {track.title}
                </p>
                <p className="text-[10px] md:text-xs text-[var(--muted)] truncate">
                  {track.featuredArtists ? `feat. ${track.featuredArtists}` : ""}
                  {track.featuredArtists && track.plays && track.plays > 0 ? " · " : ""}
                  {track.plays && track.plays > 0 ? `${track.plays.toLocaleString()} plays` : ""}
                </p>
              </div>

              {/* Duration */}
              {track.duration && (
                <span className="hidden md:block text-xs text-[var(--muted)] tabular-nums font-medium shrink-0">
                  {fmt(track.duration)}
                </span>
              )}

              {/* Actions */}
              <div
                className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <LikeButton trackId={track.id} size={14} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
