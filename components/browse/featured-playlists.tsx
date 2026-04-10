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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
      {playlists.map((playlist, i) => (
        <motion.div key={playlist.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
          <Link
            href={`/playlist/${playlist.id}`}
            className="group flex flex-col gap-2 md:gap-3 p-2 md:p-3 rounded-xl md:rounded-2xl glass-card hover:bg-[var(--surface-hover)] border-white/5 hover:border-[var(--primary)]/30 hover:shadow-[0_8px_30px_rgba(30,215,96,0.12)] hover:-translate-y-1 transition-all duration-300"
          >
            <div className="relative aspect-square rounded-lg md:rounded-xl bg-[var(--surface-3)] flex items-center justify-center overflow-hidden shadow-lg">
              {playlist.cover_url ? (
                <Image src={playlist.cover_url} alt={playlist.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                  <ListMusic size={32} className="transition-transform duration-500 group-hover:scale-110 md:w-12 md:h-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                <button onClick={(e) => { e.preventDefault(); playPlaylist(playlist.id); }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--primary)] text-black flex items-center justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[var(--glow-primary)] hover:scale-105">
                  <Play size={18} fill="currentColor" className="ml-0.5 md:w-5 md:h-5" />
                </button>
                {isSignedIn ? (
                  <button onClick={(e) => toggleSave(e, playlist.id)}
                    className="w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 hover:scale-105">
                    {saved.has(playlist.id)
                      ? <BookmarkCheck size={15} className="text-[var(--primary)]" />
                      : <BookmarkPlus size={15} className="text-white" />}
                  </button>
                ) : (
                  <SignInButton mode="modal">
                    <button onClick={e => e.preventDefault()}
                      className="w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 hover:scale-105">
                      <BookmarkPlus size={15} className="text-white" />
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm font-semibold truncate group-hover:text-[var(--primary)] transition-colors mb-0.5">{playlist.name}</p>
              <p className="text-[9px] md:text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">{playlist.category || "Playlist"}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
