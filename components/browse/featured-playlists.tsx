"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ListMusic, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { useUser, SignInButton } from "@clerk/nextjs";

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
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const { setQueue } = usePlayer();
  const { isSignedIn } = useUser();

  useEffect(() => {
    fetch("/api/playlists?type=admin")
      .then((r) => r.json())
      .then((d) => {
        const featured = Array.isArray(d) ? d.filter((p: any) => p.is_featured) : [];
        setPlaylists(featured.slice(0, 8));
      });
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/playlists?type=saved")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSaved(new Set(d.map((p: any) => p.id))); });
  }, [isSignedIn]);

  async function playPlaylist(id: number) {
    const tracks = await fetch(`/api/playlists/${id}`).then((r) => r.json());
    if (Array.isArray(tracks) && tracks.length > 0) setQueue(tracks, 0);
  }

  async function toggleSave(e: React.MouseEvent, id: number) {
    e.preventDefault();
    const isSaved = saved.has(id);
    setSaved(prev => { const s = new Set(prev); isSaved ? s.delete(id) : s.add(id); return s; });
    await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isSaved ? "unsave" : "save", playlist_id: id }),
    });
  }

  if (playlists.length === 0) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-3">
      {playlists.map((playlist, i) => (
        <motion.div key={playlist.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
          <Link
            href={`/playlist/${playlist.id}`}
            className="group flex flex-col gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-lg md:rounded-xl glass-card hover:bg-[var(--surface-hover)] border-white/5 hover:border-[var(--primary)]/30 hover:shadow-[0_8px_30px_rgba(30,215,96,0.12)] hover:-translate-y-1 transition-all duration-300"
          >
            <div className="relative aspect-square rounded-md md:rounded-lg bg-[var(--surface-3)] flex items-center justify-center overflow-hidden shadow-lg">
              {playlist.cover_url ? (
                <Image src={playlist.cover_url} alt={playlist.name} fill sizes="(max-width: 768px) 33vw, 12vw" className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                  <ListMusic size={20} className="transition-transform duration-500 group-hover:scale-110 md:w-8 md:h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 backdrop-blur-[2px]">
                <button onClick={(e) => { e.preventDefault(); playPlaylist(playlist.id); }}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--primary)] text-black flex items-center justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[var(--glow-primary)] hover:scale-105">
                  <Play size={14} fill="currentColor" className="ml-0.5 md:w-4 md:h-4" />
                </button>
                {isSignedIn ? (
                  <button onClick={(e) => toggleSave(e, playlist.id)}
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 hover:scale-105">
                    {saved.has(playlist.id)
                      ? <BookmarkCheck size={12} className="text-[var(--primary)] md:w-3.5 md:h-3.5" />
                      : <BookmarkPlus size={12} className="text-white md:w-3.5 md:h-3.5" />}
                  </button>
                ) : (
                  <SignInButton mode="modal">
                    <button onClick={e => e.preventDefault()}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 hover:scale-105">
                      <BookmarkPlus size={12} className="text-white md:w-3.5 md:h-3.5" />
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-semibold truncate group-hover:text-[var(--primary)] transition-colors mb-0.5">{playlist.name}</p>
              <p className="text-[8px] md:text-[9px] text-[var(--muted)] font-semibold uppercase tracking-wider">{playlist.category || "Playlist"}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
