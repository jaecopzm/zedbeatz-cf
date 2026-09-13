"use client";

import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import { TrackMenu } from "@/components/track-menu";
import { parseFeaturedArtists } from "@/lib/featured-artists";

export default function AppearsOn({ tracks, artistName }: { tracks: Track[]; artistName: string }) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();

  if (tracks.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="px-4 md:px-10 mb-3">
        <h2 className="font-display text-[17px] md:text-xl font-bold tracking-tight text-foreground">Appears on</h2>
      </div>

      <div className="px-4 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tracks.map((track) => {
          const isActive = queue[currentIndex]?.id === track.id;
          const otherFeatured = track.featuredArtists
            ? parseFeaturedArtists(track.featuredArtists)
                .filter(n => n.toLowerCase() !== artistName.toLowerCase())
                .join(", ")
            : undefined;

          return (
            <div
              key={track.id}
              onClick={() =>
                isActive
                  ? toggle()
                  : setQueue(tracks, tracks.findIndex((t) => t.id === track.id))
              }
              className="group relative flex items-center gap-2 md:gap-2.5 px-3 py-2 cursor-pointer transition-colors border-b border-white/[0.06] hover:bg-white/[0.03]"
            >
              {/* Artwork */}
              <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-[var(--surface-3)]">
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="48px" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)]" />
                )}

                {/* Hover play */}
                <div className={`absolute inset-0 bg-background/50 flex items-center justify-center transition-all duration-200 ${
                  isActive && playing ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                }`}>
                  {isActive && playing ? (
                    <Pause size={12} className="text-foreground" fill="currentColor" />
                  ) : (
                    <Play size={12} className="text-foreground ml-0.5" fill="currentColor" />
                  )}
                </div>

                {/* Playing eq */}
                {isActive && playing && (
                  <div className="absolute bottom-0.5 right-0.5 flex items-end gap-[1.5px] h-2.5">
                    {[1, 2, 3].map((b) => (
                      <span
                        key={b}
                        className="eq-bar eq-bar--active"
                        style={{ animationDelay: `${b * 0.15}s`, height: `${3 + b * 2}px`, width: '2px' }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className={`text-xs md:text-sm font-semibold line-clamp-2 leading-tight ${isActive ? "text-[var(--primary)]" : "text-foreground"}`}>
                  {track.title}
                </p>
                <p className="text-[11px] md:text-xs text-[var(--muted)] truncate mt-0.5">
                  {track.artist}
                  {otherFeatured && <span> feat. {otherFeatured}</span>}
                </p>
              </div>

              {/* Duration */}
              {track.duration && (
                <span className="text-[10px] text-[var(--muted-2)] tabular-nums hidden md:block shrink-0">
                  {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                </span>
              )}

              {/* Menu */}
              <div className="-mr-1">
                <TrackMenu track={track} />
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
}
