"use client";

import { useState } from "react";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";
import { ChevronDown } from "lucide-react";

const PAGE_SIZE = 24;

export default function ArtistTracks({ tracks }: { tracks: Track[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  return (
    <section id="all-tracks" className="px-4 md:px-10 mb-10">
      <div className="flex items-center gap-2.5 mb-3">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">All Tracks</h2>
        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[11px] font-semibold text-white/40">
          {tracks.length}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
        {tracks.slice(0, visible).map((track) => (
          <TrackCard key={track.id} track={track} queue={tracks} bare />
        ))}
      </div>

      {visible < tracks.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all"
          >
            <ChevronDown size={16} />
            Show more ({tracks.length - visible} remaining)
          </button>
        </div>
      )}
    </section>
  );
}
