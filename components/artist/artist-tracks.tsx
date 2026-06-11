"use client";

import TrackCard from "@/components/track-card";
import ScrollRow from "@/components/home/scroll-row";
import type { Track } from "@/lib/player-store";

export default function ArtistTracks({ tracks }: { tracks: Track[] }) {
  return (
    <section className="mb-8">
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