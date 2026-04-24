"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";

const SUGGESTIONS = ["Yo Maps", "Chile One", "Kell Kay", "Chef 187", "Macky 2", "Slapdee", "Dizmo", "Afro", "Gospel", "Hip Hop"];

export default function TracksSearch({ tracks }: { tracks: Track[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.featuredArtists?.toLowerCase().includes(q)
    );
  }, [query, tracks]);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tracks, artists…"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[var(--surface)] border border-white/10 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)]/50 transition-colors"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Suggestion chips */}
      {!query && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="shrink-0 px-3 py-1 rounded-full bg-[var(--surface)] border border-white/10 text-xs text-[var(--muted)] hover:text-white hover:border-white/20 hover:bg-[var(--surface-2)] transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Search results */}
      {filtered !== null && (
        <div>
          <p className="text-xs text-[var(--muted)] mb-3">{filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"</p>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3">
              {filtered.map((track) => (
                <TrackCard key={track.id} track={track} queue={filtered} bare />
              ))}
            </div>
          ) : (
            <p className="text-center py-12 text-[var(--muted)]">No tracks found</p>
          )}
        </div>
      )}
    </div>
  );
}
