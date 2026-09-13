"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/lib/slugify";
import { usePlayer, type Track } from "@/lib/player-store";
import { TrackMenu } from "@/components/track-menu";
import { Play, Pause } from "lucide-react";
import { encodeId } from "@/lib/hashids";

type Artist = { id: number; name: string; slug?: string; imageUrl: string | null };
type Album = { id: number; title: string; slug?: string; releaseYear?: number; coverUrl: string | null; artistName: string; artistSlug?: string };
type Results = { tracks: Track[]; artists: Artist[]; albums: Album[] };

const GENRES = [
  { label: "Afrobeats",    color: "#e91e8c" },
  { label: "Hip Hop",      color: "#1e88e5" },
  { label: "Gospel",       color: "#f59e0b" },
  { label: "R&B",          color: "#8b5cf6" },
  { label: "Dancehall",    color: "#10b981" },
  { label: "Drill",        color: "#ef4444" },
  { label: "Bongo",        color: "#f97316" },
  { label: "Amapiano",     color: "#06b6d4" },
  { label: "Praise",       color: "#84cc16" },
  { label: "Kalindula",    color: "#ec4899" },
  { label: "Reggae",       color: "#14b8a6" },
  { label: "Pop",          color: "#a855f7" },
];

function TopResult({ track, tracks }: { track: Track; tracks: Track[] }) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const isActive = queue[currentIndex]?.id === track.id;

  return (
    <div
      className="relative group rounded-2xl p-5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
      onClick={() => isActive ? toggle() : setQueue(tracks, 0)}
    >
      <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-2xl mb-4">
        {track.coverUrl
          ? <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="96px" />
          : <div className="w-full h-full bg-[var(--surface-3)] flex items-center justify-center"><Play size={24} className="text-[var(--muted)]" /></div>
        }
      </div>
      <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Top result</p>
      <p className="text-[22px] font-black leading-tight mb-1 truncate">{track.title}</p>
      <p className="text-sm text-[var(--muted)]">{track.artist}</p>

      {/* Play button */}
      <button
        className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200"
        onClick={(e) => { e.stopPropagation(); isActive ? toggle() : setQueue(tracks, 0); }}
      >
        {isActive && playing
          ? <Pause size={20} fill="black" className="text-black" />
          : <Play size={20} fill="black" className="text-black ml-0.5" />
        }
      </button>
    </div>
  );
}

function TrackRow({ track, index, tracks }: { track: Track; index: number; tracks: Track[] }) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const isActive = queue[currentIndex]?.id === track.id;

  return (
    <div
      className={`group flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"}`}
      onClick={() => isActive ? toggle() : setQueue(tracks, index)}
    >
      <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 bg-[var(--surface-3)]">
        {track.coverUrl && <Image src={track.coverUrl} alt={track.title} fill className="object-cover" sizes="40px" />}
        <div className="absolute inset-0 bg-background/50 items-center justify-center hidden group-hover:flex">
          {isActive && playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isActive ? "text-[var(--primary)]" : "text-foreground"}`}>{track.title}</p>
        <p className="text-xs text-[var(--muted)] truncate">{track.artist}</p>
      </div>
      <div onClick={e => e.stopPropagation()}>
        <TrackMenu track={track} />
      </div>
    </div>
  );
}

function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    const stored = localStorage.getItem("recent-searches");
    if (stored) try { setRecent(JSON.parse(stored)); } catch {}
  }, []);
  const addSearch = useRef((q: string) => {
    setRecent(prev => {
      const next = [q, ...prev.filter(s => s !== q)].slice(0, 8);
      localStorage.setItem("recent-searches", JSON.stringify(next));
      return next;
    });
  });
  const clearRecent = useRef(() => {
    setRecent([]);
    localStorage.removeItem("recent-searches");
  });
  return { recent, addSearch: addSearch.current, clearRecent: clearRecent.current };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const { recent, addSearch, clearRecent } = useRecentSearches();
  const [focused, setFocused] = useState(false);

  useEffect(() => { setQuery(searchParams.get("q") ?? ""); }, [searchParams]);

  const [results, setResults] = useState<Results>({ tracks: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim()) { setResults({ tracks: [], artists: [], albums: [] }); return; }
    setLoading(true);
    if (query.trim()) addSearch(query.trim());
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(await res.json());
      } catch {}
      finally { setLoading(false); }
    }, 150);
  }, [query]);

  const hasResults = results.tracks.length > 0 || results.artists.length > 0 || results.albums.length > 0;

  return (
    <div className="min-h-screen pb-10">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-20 bg-[var(--surface)]/80 backdrop-blur-xl px-4 md:px-6 pt-4 pb-3">
        <div className="relative max-w-lg mx-auto">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="What do you want to listen to?"
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-full pl-10 pr-9 py-2.5 text-sm outline-none placeholder:text-[var(--muted-2)]"
          />
          {loading
            ? <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--primary)] animate-spin" />
            : query && (
              <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[var(--muted)] hover:text-foreground transition-colors">
                <X size={11} />
              </button>
            )
          }
        </div>
      </div>

      <div className="px-4 md:px-6">
        {!query ? (
          /* ── Empty state: recent searches + genre cards ── */
          <div className="mt-6">
            {focused && recent.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-foreground/60 uppercase tracking-wider">Recent searches</h2>
                  <button onClick={clearRecent} className="text-[11px] text-[var(--muted)] hover:text-foreground transition-colors">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map(q => (
                    <button key={q} onClick={() => setQuery(q)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <h2 className="text-xl font-black mb-4">Browse all</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {GENRES.map(({ label, color }) => (
                <Link
                  key={label}
                  href={`/genre/${slugify(label)}`}
                  className="relative h-24 rounded-xl overflow-hidden text-left font-black text-base text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  style={{ background: color }}
                >
                  <span className="absolute bottom-3 left-3 drop-shadow">{label}</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30" />
                </Link>
              ))}
            </div>
          </div>
        ) : !loading && !hasResults ? (
          /* ── No results ── */
          <div className="text-center py-20">
            <p className="text-lg font-black mb-1">No results for "{query}"</p>
            <p className="text-sm text-[var(--muted)]">Check the spelling or try different keywords.</p>
          </div>
        ) : hasResults ? (
          /* ── Results ── */
          <div className="mt-6 space-y-8">
            {/* Top result + Songs row */}
            {results.tracks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top result */}
                <TopResult track={results.tracks[0]} tracks={results.tracks} />

                {/* Songs list */}
                <div>
                  <h2 className="text-xl font-black mb-3">Songs</h2>
                  <div className="flex flex-col">
                    {results.tracks.slice(0, 4).map((t, i) => (
                      <TrackRow key={t.id} track={t} index={i} tracks={results.tracks} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Artists */}
            {results.artists.length > 0 && (
              <section>
                <h2 className="text-xl font-black mb-4">Artists</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {results.artists.map(a => (
                    <Link key={a.id} href={`/artist/${encodeId(a.id)}`}
                      className="group flex flex-col items-center gap-2 text-center">
                      <div className="relative w-full aspect-square rounded-full overflow-hidden bg-[var(--surface-3)] shadow-md group-hover:shadow-lg transition-shadow">
                        {a.imageUrl
                          ? <Image src={a.imageUrl} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="20vw" />
                          : <div className="w-full h-full flex items-center justify-center text-xl font-black text-[var(--muted)]">{a.name[0]}</div>
                        }
                      </div>
                      <p className="text-xs font-semibold truncate w-full">{a.name}</p>
                      <p className="text-[10px] text-[var(--muted)] -mt-1">Artist</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Albums */}
            {results.albums.length > 0 && (
              <section>
                <h2 className="text-xl font-black mb-4">Albums</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {results.albums.map(a => (
                    <Link key={a.id} href={`/album/${encodeId(a.id)}`}
                      className="group flex flex-col gap-2">
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-[var(--surface-3)] shadow-md group-hover:shadow-lg transition-shadow">
                        {a.coverUrl
                          ? <Image src={a.coverUrl} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="20vw" />
                          : <div className="w-full h-full bg-[var(--surface-3)]" />
                        }
                      </div>
                      <div>
                        <p className="text-xs font-semibold truncate">{a.title}</p>
                        <p className="text-[10px] text-[var(--muted)] truncate">{a.releaseYear ? `${a.releaseYear} · ` : ""}{a.artistName}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}