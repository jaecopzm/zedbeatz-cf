"use client";

import { useState, useEffect } from "react";
import { Search, Trash2, GripVertical, Plus, Loader2, Star } from "lucide-react";
import Image from "next/image";

type Track = { id: number; title: string; artist: string; coverUrl?: string; slug?: string };

export default function HeroManagerPage() {
  const [heroTracks, setHeroTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHero(); }, []);

  async function loadHero() {
    setLoading(true);
    const data = await fetch("/api/admin/hero").then(r => r.json());
    setHeroTracks(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const data = await fetch(`/api/tracks?search=${encodeURIComponent(searchQuery)}&limit=10`).then(r => r.json());
      setSearchResults(Array.isArray(data) ? data.filter((t: Track) => !heroTracks.some(h => h.id === t.id)) : []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, heroTracks]);

  async function addTrack(track: Track) {
    await fetch("/api/admin/hero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track_id: track.id }),
    });
    setHeroTracks(prev => [...prev, track]);
    setSearchQuery("");
    setSearchResults([]);
  }

  async function removeTrack(trackId: number) {
    await fetch("/api/admin/hero", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track_id: trackId }),
    });
    setHeroTracks(prev => prev.filter(t => t.id !== trackId));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-500 flex items-center justify-center">
            <Star size={18} className="text-black" />
          </div>
          Hero Manager
        </h1>
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">
          Manage tracks shown in the home hero carousel
        </p>
      </div>

      {/* Search to add */}
      <div className="glass-card rounded-2xl p-4 space-y-3 border-white/10">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tracks to add..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-all"
          />
          {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-white/30" />}
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-1">
            {searchResults.map(track => (
              <button key={track.id} onClick={() => addTrack(track)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left group">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0">
                  {track.coverUrl && <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{track.title}</p>
                  <p className="text-xs text-white/40 truncate">{track.artist}</p>
                </div>
                <Plus size={16} className="text-[var(--primary)] opacity-0 group-hover:opacity-100 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current hero tracks */}
      <div className="glass-card rounded-2xl border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
            Hero Tracks ({heroTracks.length})
          </p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm">Loading...</div>
        ) : heroTracks.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">No hero tracks set. Search above to add some.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {heroTracks.map((track, i) => (
              <div key={track.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-white/[0.02]">
                <GripVertical size={16} className="text-white/20 shrink-0" />
                <span className="text-xs font-black text-white/20 w-4 shrink-0">{i + 1}</span>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0">
                  {track.coverUrl && <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{track.title}</p>
                  <p className="text-xs text-white/40 truncate">{track.artist}</p>
                </div>
                <button onClick={() => removeTrack(track.id)}
                  className="p-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-white/20 text-center">
        Showing up to 5 tracks in the hero carousel. Add 3–5 for best results.
      </p>
    </div>
  );
}
