"use client";

import Image from "next/image";
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
    <section className="px-4 md:px-10 mb-8">
      <div className="flex items-center gap-2.5 mb-3">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">Popular</h2>
      </div>

      <div className="flex flex-col gap-0.5">
        {tracks.map((track, i) => {
          const isActive = queue[currentIndex]?.id === track.id;

          return (
            <div
              key={track.id}
              onClick={() =>
                isActive
                  ? toggle()
                  : setQueue(allTracks, allTracks.findIndex((t) => t.id === track.id))
              }
              className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                isActive ? "bg-white/8 ring-1 ring-[#1db954]/30" : "hover:bg-white/5"
              }`}
            >
              <span className={`text-xs font-bold w-4 text-center shrink-0 tabular-nums ${isActive ? "text-[#1db954]" : "text-white/30"}`}>
                {i + 1}
              </span>

              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20">♪</div>
                )}
                {isActive && playing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="eq-container" aria-hidden>
                      {[0.3, 0.7, 0.5].map((delay, i) => (
                        <span key={i} className="eq-bar eq-bar--active" style={{ animationDelay: `${delay}s` }} />
                      ))}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isActive ? "text-[#1db954]" : "text-white"}`}>
                  {track.title}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {track.featuredArtists ? `feat. ${track.featuredArtists}` : ""}
                  {track.featuredArtists && track.plays ? " · " : ""}
                  {track.plays ? `${track.plays.toLocaleString()} plays` : ""}
                </p>
              </div>

              {track.duration && (
                <span className="text-xs text-white/30 tabular-nums shrink-0">{fmt(track.duration)}</span>
              )}

              <div className="flex items-center gap-2 shrink-0">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <LikeButton trackId={track.id} size={15} />
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive && playing ? "bg-[#1db954] text-black" : "text-white/40 group-hover:bg-white/10 group-hover:text-white"
                }`}>
                  {isActive && playing ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
