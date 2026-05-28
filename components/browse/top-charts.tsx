"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

export default function TopCharts({ tracks }: { tracks: Track[] }) {
  const { setQueue } = usePlayer();
  const topTracks = tracks.slice(0, 10);

  return (
    <div className="space-y-1">
      {topTracks.map((track, i) => (
        <div
          key={track.id}
          onClick={() => setQueue(topTracks, i)}
          className="group flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface)] transition-all cursor-pointer"
        >
          <span className="w-6 text-center text-sm font-bold text-[var(--muted)] tabular-nums">
            {i + 1}
          </span>
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[var(--surface-3)]">
            {track.coverUrl ? (
              <Image src={track.coverUrl} alt={track.title} fill sizes="40px" className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">♪</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate group-hover:text-[var(--primary)] transition-colors">{track.title}</p>
            <p className="text-xs text-[var(--muted)] truncate">{track.artist}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <Play size={12} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
      ))}
    </div>
  );
}