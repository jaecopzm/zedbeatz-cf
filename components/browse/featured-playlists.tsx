"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ListMusic, Pause } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import ScrollRow from "@/components/home/scroll-row";

type Playlist = {
  id: number;
  name: string;
  cover_url?: string;
  is_featured: boolean;
  category?: string;
  playlist_tracks: { count: number }[];
};

export default function FeaturedPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { setQueue, currentTrack, playing, toggle } = usePlayer();
  const [playingPlaylistId, setPlayingPlaylistId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/playlists?type=admin")
      .then((r) => r.json())
      .then((d) => {
        const featured = Array.isArray(d) ? d.filter((p: any) => p.is_featured) : [];
        setPlaylists(featured.slice(0, 8));
      });
  }, []);

  async function playPlaylist(id: number) {
    const tracks = await fetch(`/api/playlists/${id}`).then((r) => r.json());
    if (Array.isArray(tracks) && tracks.length > 0) {
      setQueue(tracks, 0);
      setPlayingPlaylistId(id);
    }
  }

  function handlePlayPause(e: React.MouseEvent, id: number) {
    e.preventDefault();
    if (playingPlaylistId === id && currentTrack) {
      toggle();
    } else {
      playPlaylist(id);
    }
  }

  if (playlists.length === 0) return null;

  return (
    <ScrollRow>
      {playlists.map((playlist, i) => {
        const isCurrentlyPlaying = playingPlaylistId === playlist.id && currentTrack && playing;
        return (
          <motion.div key={playlist.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }} className="flex-shrink-0 w-[140px] md:w-[176px] snap-start">
            <Link
              href={`/playlist/${playlist.id}`}
              className="group flex flex-col gap-1.5 md:gap-2 transition-all duration-300"
            >
              <div className="relative aspect-square rounded overflow-hidden bg-[var(--surface-3)] shadow-md ring-1 ring-white/[0.04] transition-all duration-300 group-hover:shadow-xl group-hover:ring-[var(--primary)]/30 group-hover:scale-[1.02]">
                {playlist.cover_url ? (
                  <Image src={playlist.cover_url} alt={playlist.name} fill sizes="(max-width: 768px) 140px, 176px" className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                    <ListMusic size={24} />
                  </div>
                )}
                <div className="absolute inset-0 bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <button onClick={(e) => handlePlayPause(e, playlist.id)}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[var(--primary)] text-black flex items-center justify-center shadow-xl shadow-[var(--primary-glow)] scale-90 group-hover:scale-100 transition-transform duration-300">
                    {isCurrentlyPlaying ? (
                      <Pause size={14} fill="currentColor" />
                    ) : (
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="min-w-0">
                <p className={`text-xs md:text-sm font-bold truncate transition-colors ${isCurrentlyPlaying ? 'text-[var(--primary)]' : 'group-hover:text-[var(--primary)]'}`}>{playlist.name}</p>
                <p className="text-[10px] text-[var(--muted)] truncate">{playlist.category || "Playlist"}</p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </ScrollRow>
  );
}