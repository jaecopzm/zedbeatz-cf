"use client";

import { Flame, MoreHorizontal } from "lucide-react";
import { type Track } from "@/lib/player-store";
import TrackListItem from "@/components/track-list-item";

export default function TrendingSection({ tracks }: { tracks: Track[] }) {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--surface)] text-center">
        <div className="w-12 h-12 bg-[var(--surface-2)] flex items-center justify-center mb-3">
          <Flame size={20} className="text-foreground/40" />
        </div>
        <h3 className="text-base font-bold mb-1 text-foreground">Nothing trending</h3>
        <p className="text-xs text-foreground/50">Check back later for hot tracks</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {tracks.map((track, i) => (
        <TrackListItem key={track.id} track={track} index={i} tracks={tracks} />
      ))}
    </div>
  );
}
