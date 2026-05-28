"use client";

import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

export default function PopularTracks({
  tracks,
  allTracks,
}: {
  tracks: Track[];
  allTracks: Track[];
}) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();

  return (
    <section className="px-4 md:px-10 mb-8">
      <h2 className="text-xl md:text-[26px] font-black tracking-tight mb-3">Popular</h2>

      <div className="flex flex-col gap-0.5">
        {tracks.map((track) => {
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
                isActive ? "bg-[var(--surface)]" : "hover:bg-[var(--surface)]"
              }`}
            >
              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[var(--surface-3)]">
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">♪</div>
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
                <p className={`text-sm font-semibold truncate ${isActive ? "text-[var(--primary)]" : "text-white"}`}>
                  {track.title}
                </p>
                {track.featuredArtists && (
                  <p className="text-xs text-[var(--muted)] truncate">feat. {track.featuredArtists}</p>
                )}
              </div>

              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shrink-0">
                {isActive && playing ? (
                  <Pause size={12} fill="currentColor" className="text-black" />
                ) : (
                  <Play size={12} fill="currentColor" className="text-black ml-0.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}