"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, LayoutGrid, Clock, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";

type Artist = { id: number; name: string; slug?: string; imageUrl: string | null };
type Album = { id: number; title: string; slug?: string; releaseYear?: number; coverUrl: string | null; artistName: string; artistSlug?: string };
type Results = { tracks: Track[]; artists: Artist[]; albums: Album[]; genres: string[] };

const TRENDING = [
  "Yo Maps", "Chile One", "Kell Kay", "Afrobeat", "Gospel", "Hip Hop",
];

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
  }, [searchParams]);

  const [results, setResults] = useState<Results>({ tracks: [], artists: [], albums: [], genres: [] });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateScrollState() {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }

  function scrollShelf(dir: 1 | -1) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * scrollRef.current.clientWidth * 0.75, behavior: "smooth" });
  }

  useEffect(() => {
    const saved = localStorage.getItem("search-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    fetch("/api/tracks?limit=12")
      .then((r) => r.json())
      .then(setRecentTracks)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [results.tracks.length]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim()) {
      setResults({ tracks: [], artists: [], albums: [], genres: [] });
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  function handleSearch(q: string) {
    setQuery(q);
    inputRef.current?.focus();
    if (q && !history.includes(q)) {
      const newHistory = [q, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem("search-history", JSON.stringify(newHistory));
    }
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("search-history");
  }

  const hasResults = results.tracks.length > 0 || results.artists.length > 0 || results.albums.length > 0;
  const showEmptyState = !query;

  return (
    <div className="min-h-screen pb-6">
      {/* Search Bar - sticky */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/80 backdrop-blur-xl pt-3 md:pt-5 pb-3 px-4 md:px-8">
        <div className="relative max-w-xl md:mx-auto">
          <div className="relative group">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder="Search artists, songs, albums..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--surface-2)] placeholder:text-[var(--muted-2)] transition-all duration-200"
            />
            {loading ? (
              <Loader2 size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--primary)] animate-spin" />
            ) : query ? (
              <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[var(--muted)] hover:text-white hover:bg-[var(--surface-hover)] transition-all">
                <X size={11} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8">
        {showEmptyState ? (
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-4">
            <div className="w-full space-y-5">
              {/* Search History */}
              {history.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[var(--muted)]" />
                      <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em]">Recent</h2>
                    </div>
                    <button onClick={clearHistory} className="text-[10px] text-[var(--muted)] hover:text-white transition-colors font-medium">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(term)}
                        className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-white/20 text-[11px] font-medium text-white/60 hover:text-white transition-all"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Trending */}
              <section>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={12} className="text-[var(--muted)]" />
                  <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em]">Trending</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {TRENDING.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-white/20 hover:bg-[var(--surface-2)] transition-all text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                        <Search size={12} className="text-[var(--muted)]" />
                      </div>
                      <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors truncate">{term}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Recent Added Songs */}
              {recentTracks.length > 0 && (
                <section>
                  <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em] mb-2">Recent Added Songs</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                    {recentTracks.slice(0, 8).map((track) => (
                      <TrackCard key={track.id} track={track} queue={recentTracks} bare minimal />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={hasResults ? "results" : "no-results"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {!loading && !hasResults ? (
                  <div className="text-center py-16 md:py-24">
                    <div className="w-14 h-14 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-[var(--muted)]" />
                    </div>
                    <p className="text-white text-base font-bold mb-0.5">No results for &ldquo;{query}&rdquo;</p>
                    <p className="text-[var(--muted)] text-xs">Check the spelling or try a different search</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Albums */}
                    {results.albums.length > 0 && (
                      <section>
                        <h2 className="text-base md:text-xl font-black tracking-tight mb-3">Albums</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                          {results.albums.map((album) => (
                            <Link key={album.id} href={`/album/${album.slug || album.id}`}
                              className="group flex flex-col gap-1.5">
                              <div className="relative aspect-square rounded-xl overflow-hidden bg-[var(--surface-3)] shadow-sm ring-1 ring-white/[0.04] transition-all duration-300 group-hover:shadow-md group-hover:ring-[var(--primary)]/30 group-hover:scale-[1.02]">
                                {album.coverUrl ? (
                                  <Image src={album.coverUrl} alt={album.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 768px) 33vw, 16vw" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                                    <LayoutGrid size={20} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] md:text-xs font-bold truncate group-hover:text-[var(--primary)] transition-colors">{album.title}</p>
                                <p className="text-[10px] text-[var(--muted)] truncate">{album.artistName}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Artists */}
                    {results.artists.length > 0 && (
                      <section>
                        <h2 className="text-base md:text-xl font-black tracking-tight mb-3">Artists</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                          {results.artists.map((artist) => (
                            <Link key={artist.id} href={artist.slug ? `/artist/${artist.slug}` : `/artist/${artist.id}`}
                              className="group flex flex-col items-center gap-1.5">
                              <div className="relative w-full aspect-square rounded-full overflow-hidden bg-[var(--surface-3)] shadow-sm ring-1 ring-white/[0.04] transition-all duration-300 group-hover:shadow-md group-hover:ring-[var(--primary)]/30 group-hover:scale-[1.02]">
                                {artist.imageUrl ? (
                                  <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 768px) 33vw, 16vw" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-base font-bold text-[var(--muted)]">
                                    {artist.name[0]}
                                  </div>
                                )}
                              </div>
                              <p className="text-[11px] md:text-xs font-bold truncate text-center group-hover:text-[var(--primary)] transition-colors">{artist.name}</p>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Songs */}
                    {results.tracks.length > 0 && (
                      <section>
                        <h2 className="text-base md:text-xl font-black tracking-tight mb-3 px-4 md:px-8">Songs</h2>
                        <div className="relative group/row">
                          <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-4 md:px-8">
                            {results.tracks.map((track) => (
                              <div key={track.id} className="w-[130px] sm:w-[150px] shrink-0 snap-start">
                                <TrackCard track={track} queue={results.tracks} bare minimal />
                              </div>
                            ))}
                            <div className="w-2 shrink-0" />
                          </div>
                          {canScrollLeft && (
                            <button onClick={() => scrollShelf(-1)}
                              className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-[var(--background)]/90 border border-[var(--border)] text-white shadow-xl backdrop-blur-sm opacity-0 group-hover/row:opacity-100 hover:bg-[var(--surface)] hover:scale-105 active:scale-95 transition-all duration-200"
                              aria-label="Scroll left">
                              <ChevronLeft size={16} strokeWidth={2.5} />
                            </button>
                          )}
                          {canScrollRight && (
                            <button onClick={() => scrollShelf(1)}
                              className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-[var(--background)]/90 border border-[var(--border)] text-white shadow-xl backdrop-blur-sm opacity-0 group-hover/row:opacity-100 hover:bg-[var(--surface)] hover:scale-105 active:scale-95 transition-all duration-200"
                              aria-label="Scroll right">
                              <ChevronRight size={16} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
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