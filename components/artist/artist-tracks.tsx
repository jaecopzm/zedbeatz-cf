"use client";

import TrackCard from "@/components/track-card";
import ScrollRow from "@/components/home/scroll-row";
import type { Track } from "@/lib/player-store";

export default function ArtistTracks({ tracks }: { tracks: Track[] }) {
  return (
    <section className="mb-8">
      <div className="px-4 md:px-10 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl md:text-[26px] font-black tracking-tight">Discography</h2>
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-[11px] font-semibold text-[var(--muted)]">{tracks.length}</span>
        </div>
      </div>

      <ScrollRow>
        {tracks.map((track) => (
          <div key={track.id} className="flex-shrink-0 w-[140px] md:w-[176px] snap-start">
            <TrackCard track={track} queue={tracks} bare minimal />
          </div>
        ))}
      </ScrollRow>
    </section>
  );
}