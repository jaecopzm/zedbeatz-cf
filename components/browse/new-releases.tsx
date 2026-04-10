"use client";

import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";

export default function NewReleases({ tracks }: { tracks: Track[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} queue={tracks} />
      ))}
    </div>
  );
}
