"use client";

import TrackCard from "@/components/track-card";
import ScrollRow from "@/components/home/scroll-row";
import type { Track } from "@/lib/player-store";

export default function NewReleases({ tracks }: { tracks: Track[] }) {
  return (
    <ScrollRow>
      {tracks.slice(0, 12).map((track) => (
        <div key={track.id} className="flex-shrink-0 w-[140px] md:w-[176px] snap-start">
          <TrackCard track={track} queue={tracks} bare />
        </div>
      ))}
    </ScrollRow>
  );
}
