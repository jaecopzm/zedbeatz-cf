"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";

const SUGGESTIONS = ["Yo Maps", "Chile One", "Kell Kay", "Chef 187", "Macky 2", "Slapdee", "Gospel", "Hip Hop"];

export default function TracksSearch({ tracks }: { tracks: Track[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return tracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.featuredArtists?.toLowerCase().includes(q)
    );
  }, [query, tracks]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter tracks…"
          aria-label="Filter tracks"
          className="w-full pl-9 pr-8 py-2 rounded bg-[var(--surface-2)] border border-[var(--border)] text-sm placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear filter" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-foreground">
            <X size={13} />
          </button>
        )}
      </div>

      {!query && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setQuery(s)}
              className="shrink-0 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)] hover:text-foreground hover:bg-[var(--surface-3)] transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {filtered !== null && (
        <div>
          <p className="text-xs text-[var(--muted)] mb-2">{filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;</p>
          {filtered.length > 0 ? (
            <div className="px-0">
              {filtered.map(t => <TrackCard key={t.id} track={t} queue={filtered} bare minimal />)}
            </div>
          ) : (
            <p className="text-center py-10 text-sm text-[var(--muted)]">No tracks found</p>
          )}
        </div>
      )}
    </div>
  );
}
