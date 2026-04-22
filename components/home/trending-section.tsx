"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, Flame } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

const RANK_STYLE: Record<number, string> = {
  0: "bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.6)]",
  1: "bg-slate-300 text-black",
  2: "bg-amber-700 text-white",
};

export default function TrendingSection({ tracks }: { tracks: Track[] }) {
  const { queue: pQueue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const [featured, ...rest] = tracks;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 auto-rows-auto">
      {featured && (
        <BentoCard track={featured} index={0} tracks={tracks} isLarge
          pQueue={pQueue} pIndex={currentIndex} playing={playing} setQueue={setQueue} toggle={toggle} />
      )}
      {rest.slice(0, 8).map((track, i) => (
        <BentoCard key={track.id} track={track} index={i + 1} tracks={tracks} isLarge={false}
          pQueue={pQueue} pIndex={currentIndex} playing={playing} setQueue={setQueue} toggle={toggle} />
      ))}
    </div>
  );
}

function BentoCard({ track, index, tracks, isLarge, pQueue, pIndex, playing, setQueue, toggle }: {
  track: Track; index: number; tracks: Track[]; isLarge: boolean;
  pQueue: Track[]; pIndex: number; playing: boolean;
  setQueue: (q: Track[], i: number) => void; toggle: () => void;
}) {
  const isActive = pQueue[pIndex]?.id === track.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className={isLarge ? "col-span-2 md:row-span-2" : "col-span-1"}
    >
      <div
        className={`group relative overflow-hidden rounded-xl md:rounded-2xl cursor-pointer transition-all duration-500 hover:-translate-y-1 ${
          isActive ? "ring-2 ring-[var(--primary)]/70 shadow-[0_0_30px_rgba(30,215,96,0.2)]"
                   : "hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
        } ${isLarge ? "h-[140px] md:h-[340px]" : "h-[120px] md:h-[162px]"}`}
        onClick={() => isActive ? toggle() : setQueue(tracks, index)}
      >
        {track.coverUrl ? (
          <Image src={track.coverUrl} alt={track.title} fill
            className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Rank chip */}
        <div className={`absolute top-2 left-2 md:top-2.5 md:left-2.5 flex items-center justify-center font-black rounded-lg shadow-lg ${
          isLarge ? "w-7 h-7 text-xs md:w-9 md:h-9 md:text-base" : "w-6 h-6 text-[10px] md:w-7 md:h-7 md:text-xs"
        } ${RANK_STYLE[index] ?? "bg-black/70 backdrop-blur-sm text-white"}`}>
          {index + 1}
        </div>

        {isLarge && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase">
            <Flame size={10} /> Hot
          </div>
        )}

        {isActive && playing && (
          <div className="absolute top-2.5 right-2.5 flex items-end gap-[2px] h-5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
            {[1, 2, 3, 4].map(i => (
              <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
          <Link href={track.slug ? `/track/${track.slug}` : `/track/${track.id}`}
            onClick={e => e.stopPropagation()}
            className={`font-bold truncate block hover:underline leading-tight ${
              isActive ? "text-[var(--primary)]" : "text-white"
            } ${isLarge ? "text-sm md:text-xl mb-0.5 md:mb-1" : "text-xs md:text-sm"}`}>
            {track.title}
          </Link>
          <p className={`text-[var(--muted)] truncate ${isLarge ? "text-xs md:text-sm" : "text-[10px]"}`}>
            {track.artist}
          </p>
          {isLarge && (
            <div className="hidden md:flex items-center gap-3 mt-3">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
                  isActive && playing
                    ? "bg-[var(--primary)] text-black"
                    : "bg-white/10 backdrop-blur text-white border border-white/10 hover:bg-[var(--primary)] hover:text-black"
                }`}
                onClick={e => { e.stopPropagation(); isActive ? toggle() : setQueue(tracks, 0); }}
              >
                {isActive && playing
                  ? <><Pause size={14} fill="currentColor" /> Pause</>
                  : <><Play size={14} fill="currentColor" className="ml-0.5" /> Play</>}
              </button>
              {track.duration && (
                <span className="text-xs text-[var(--muted)] tabular-nums">
                  {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")}
                </span>
              )}
            </div>
          )}
        </div>

        {!isLarge && (
          <div className={`absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            isActive && playing
              ? "bg-[var(--primary)] opacity-100 scale-100"
              : "bg-white/90 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          }`}>
            {isActive && playing
              ? <Pause size={13} className="text-black" fill="currentColor" />
              : <Play size={13} className="text-black ml-0.5" fill="currentColor" />}
          </div>
        )}
      </div>
    </motion.div>
  );
}
