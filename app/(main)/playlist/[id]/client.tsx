"use client";

import { Play, ListMusic, Clock, Shuffle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";
import TrackRow from "@/components/track-row";

export default function PlaylistPageClient({ playlist, tracks }: { playlist: any; tracks: Track[] }) {
  const { setQueue } = usePlayer();

  function playAll(shuffle = false) {
    if (!tracks.length) return;
    const q = shuffle ? [...tracks].sort(() => Math.random() - 0.5) : tracks;
    setQueue(q, 0);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-32 pt-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
        <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-[var(--surface-2)] shrink-0 shadow-2xl">
          {playlist.coverUrl ? (
            <Image src={playlist.coverUrl} alt={playlist.name} width={208} height={208} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ListMusic size={48} className="text-[var(--muted)]" />
            </div>
          )}
        </div>
        <div className="text-center sm:text-left">
          {playlist.category && <p className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-2">{playlist.category}</p>}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">{playlist.name}</h1>
          <p className="text-[var(--muted)] text-sm mb-5">{tracks.length} tracks</p>
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <button onClick={() => playAll()}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-[var(--glow-primary)] transition-all">
              <Play size={16} fill="currentColor" /> Play
            </button>
            <button onClick={() => playAll(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all">
              <Shuffle size={16} /> Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="space-y-1">
        {tracks.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted)]">
            <ListMusic size={40} className="mx-auto mb-3 opacity-20" />
            <p>No tracks in this playlist yet.</p>
          </div>
        ) : tracks.map((track, i) => (
          <TrackRow key={track.id} track={track} queue={tracks} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
