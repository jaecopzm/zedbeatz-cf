"use client";

import { useState } from "react";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";
import { ChevronDown } from "lucide-react";

const PAGE_SIZE = 24;

export default function ArtistTracks({ tracks }: { tracks: Track[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  return (
    <section id="all-tracks" className="px-4 md:px-10 mb-10 md:mb-12">
      <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5">
        <h2 className="text-lg md:text-2xl font-bold tracking-tight">All Tracks</h2>
        <span className="text-[10px] md:text-xs font-semibold text-[var(--muted)] bg-[var(--surface-2)] px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
          {tracks.length}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
        {tracks.slice(0, visible).map((track) => (
          <TrackCard key={track.id} track={track} queue={tracks} />
        ))}
      </div>

      {visible < tracks.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-sm font-semibold transition-colors"
          >
            <ChevronDown size={16} />
            Show more ({tracks.length - visible} remaining)
          </button>
        </div>
      )}
    </section>
  );
}
