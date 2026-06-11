"use client";

import type { Track } from "@/lib/player-store";
import TracksListClient from "@/components/tracks-list-client";
import TrackCard from "@/components/track-card";
import { ChevronLeft, Music } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function GenrePageClient({
  genreName,
  tracks,
}: {
  genreName: string;
  tracks: Track[];
}) {
  const topTracks = useMemo(() => tracks.slice(0, 6), [tracks]);

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[var(--surface-2)] to-[var(--surface)] px-4 md:px-8 pt-6 pb-8 md:pb-10">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[var(--primary)] blur-[100px]" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-purple-500 blur-[80px]" />
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          Back to Home
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center shadow-xl shrink-0">
            <Music size={28} className="text-black/70 md:w-10 md:h-10" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Genre</p>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight truncate">
              {genreName}
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            </p>
          </div>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="px-4 md:px-8 py-16 text-center">
          <p className="text-lg font-semibold text-[var(--muted)]">No tracks found for this genre.</p>
          <p className="text-sm text-[var(--muted-2)] mt-1">Check back later for new releases.</p>
        </div>
      ) : (
        <>
          {/* Top tracks grid */}
          {topTracks.length > 0 && (
            <section className="px-4 md:px-8 mt-6 mb-8">
              <h2 className="text-lg font-black mb-3">Top {genreName} Tracks</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                {topTracks.map((track) => (
                  <TrackCard key={track.id} track={track} queue={tracks} minimal />
                ))}
              </div>
            </section>
          )}

          {/* All tracks list */}
          <section className="px-4 md:px-8">
            <h2 className="text-lg font-black mb-3">All {genreName} Tracks</h2>
            <TracksListClient tracks={tracks} />
          </section>
        </>
      )}
    </div>
  );
}
