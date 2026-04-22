"use client";

import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";

export default function NewReleases({ tracks }: { tracks: Track[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {tracks.slice(0, 12).map((track) => (
        <TrackCard key={track.id} track={track} queue={tracks} />
      ))}
    </div>
  );
}
