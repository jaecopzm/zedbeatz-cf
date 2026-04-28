"use client";

import Image from "next/image";
import { Flame, Music } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

const RANK_STYLE: Record<number, string> = {
  0: "bg-yellow-400 text-black",
  1: "bg-slate-300 text-black", 
  2: "bg-amber-700 text-white",
};

export default function TrendingSection({ tracks }: { tracks: Track[] }) {
  const { queue: pQueue, currentIndex, playing, setQueue, toggle } = usePlayer();

  if (!tracks || tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--surface)] text-center">
        <div className="w-12 h-12 bg-[var(--surface-2)] flex items-center justify-center mb-3">
          <Flame size={20} className="text-white/40" />
        </div>
        <h3 className="text-base font-bold mb-1 text-white">Nothing trending</h3>
        <p className="text-xs text-white/50">Check back later for hot tracks</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
      {tracks.map((track, i) => (
        <div key={track.id} className={i >= 6 ? "hidden md:block" : ""}>
          <TrendingCard track={track} index={i} tracks={tracks}
            pQueue={pQueue} pIndex={currentIndex} playing={playing} setQueue={setQueue} toggle={toggle} />
        </div>
      ))}
    </div>
  );
}

function TrendingCard({ track, index, tracks, pQueue, pIndex, playing, setQueue, toggle }: {
  track: Track; index: number; tracks: Track[];
  pQueue: Track[]; pIndex: number; playing: boolean;
  setQueue: (q: Track[], i: number) => void; toggle: () => void;
}) {
  const isActive = pQueue[pIndex]?.id === track.id;

  return (
    <div
      className="group relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] bg-[var(--surface)] hover:bg-[var(--surface-2)] aspect-square"
      onClick={() => isActive ? toggle() : setQueue(tracks, index)}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center">
        <Music size={24} className="opacity-20 text-white" />
      </div>

      {track.coverUrl && (
        <Image src={track.coverUrl} alt={track.title} fill
          className="object-cover transition-transform duration-300 group-hover:scale-105" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Rank */}
      <div className={`absolute top-2 left-2 w-6 h-6 flex items-center justify-center text-[10px] font-black ${
        RANK_STYLE[index] ?? "bg-black/70 text-white"
      }`}>
        {index + 1}
      </div>

      {/* Play indicator */}
      {isActive && playing && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-[var(--primary)] flex items-center justify-center">
          <div className="w-1 h-1 bg-black animate-pulse" />
        </div>
      )}

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2">
        <p className={`text-[10px] md:text-xs font-bold truncate ${isActive ? "text-[var(--primary)]" : "text-white"}`}>
          {track.title}
        </p>
        <p className="text-[8px] md:text-[10px] text-white/60 truncate">{track.artist}</p>
      </div>
    </div>
  );
}
