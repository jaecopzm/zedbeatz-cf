"use client";

import { useState } from "react";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";
import { ChevronDown } from "lucide-react";

const PAGE_SIZE = 24;

export default function ArtistTracks({ tracks }: { tracks: Track[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  return (
    <section id="all-tracks" className="px-4 md:px-10 mb-10 md:mb-14">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5 md:mb-7">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[var(--primary)] to-emerald-400 shrink-0" />
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">All Tracks</h2>
        <span className="px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[11px] font-semibold text-[var(--muted)]">
          {tracks.length}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3">
        {tracks.slice(0, visible).map((track) => (
          <TrackCard key={track.id} track={track} queue={tracks} bare />
        ))}
      </div>

      {visible < tracks.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="flex items-center gap-2 px-6 py-3 rounded-full glass-card hover:bg-white/10 text-white font-semibold transition-all hover:-translate-y-0.5"
          >
            <ChevronDown size={18} />
            Show more ({tracks.length - visible} remaining)
          </button>
        </div>
      )}
    </section>
  );
}
