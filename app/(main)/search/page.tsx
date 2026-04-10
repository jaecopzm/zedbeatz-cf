"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Music, User, TrendingUp, Clock, Flame, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";

type Artist = { id: number; name: string; slug?: string; imageUrl: string | null };
type Results = { tracks: Track[]; artists: Artist[] };

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<Results>({ tracks: [], artists: [] });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "tracks" | "artists">("all");
  const [history, setHistory] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const saved = localStorage.getItem("search-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim()) {
      setResults({ tracks: [], artists: [] });
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

  const filteredTracks = filter === "artists" ? [] : results.tracks;
  const filteredArtists = filter === "tracks" ? [] : results.artists;
  const hasResults = filteredTracks.length > 0 || filteredArtists.length > 0;

  return (
    <div className="min-h-screen pb-32">
      {/* Header with Search */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-[var(--background)] via-[var(--background)] to-transparent pb-4 md:pb-6 pt-4 md:pt-8 px-4 md:px-8 border-b border-transparent transition-all duration-300 backdrop-blur-md">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight"
        >
          Search
        </motion.h1>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative max-w-4xl"
        >
          <div className="relative group">
            {/* Search Input Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--primary)]/20 to-purple-500/20 rounded-full blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            
            <div className="relative">
              <Search size={16} className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors md:w-[18px] md:h-[18px]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                placeholder="Artists, songs, or podcasts"
                className="w-full bg-[var(--surface)] glass-card border border-[var(--border)] rounded-full pl-11 md:pl-16 pr-11 md:pr-14 py-2.5 md:py-4 text-sm md:text-base outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--surface-2)] placeholder:text-[var(--muted)] transition-all shadow-xl"
              />
              <AnimatePresence>
                {loading ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2"
                  >
                    <Loader2 size={16} className="text-[var(--primary)] animate-spin md:w-5 md:h-5" />
                  </motion.div>
                ) : query ? (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setQuery("")}
                    className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-7 h-7 md:w-9 md:h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all ring-1 ring-white/10 border border-white/5"
                  >
                    <X size={12} className="md:w-4 md:h-4" />
                  </motion.button>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          {/* Filter Tabs */}
          {query && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 mt-3"
            >
              {[
                { key: "all", label: "All" },
                { key: "tracks", label: "Songs" },
                { key: "artists", label: "Artists" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as typeof filter)}
                  className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all border ${
                    filter === tab.key
                      ? "bg-[var(--primary)] text-black border-transparent shadow-[var(--glow-primary)]"
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="px-4 md:px-8 mt-6 md:mt-8">
        {/* Empty State - Trending & History */}
        {!query && (
          <div className="space-y-6 md:space-y-8">
            {/* Search History */}
            {history.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[var(--primary)] md:w-[18px] md:h-[18px]" />
                    <h2 className="text-base md:text-xl font-bold">Recent Searches</h2>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-[var(--muted)] hover:text-white transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((term, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setQuery(term)}
                      className="px-3 md:px-4 py-1.5 md:py-2 rounded-full glass-card hover:bg-[var(--primary-dim)] hover:border-[var(--primary)]/30 border-white/5 text-xs md:text-sm font-medium transition-all"
                    >
                      {term}
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Trending Searches */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <TrendingUp size={16} className="text-orange-500 md:w-[18px] md:h-[18px]" />
                <h2 className="text-base md:text-xl font-bold">Trending Searches</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
                {[
                  { term: "Yo Maps", color: "from-orange-600 to-amber-400" },
                  { term: "Chile One", color: "from-blue-600 to-cyan-400" },
                  { term: "Kell Kay", color: "from-purple-600 to-pink-400" },
                  { term: "Afrobeat", color: "from-green-600 to-emerald-400" },
                  { term: "Gospel", color: "from-indigo-600 to-violet-400" },
                  { term: "Hip Hop", color: "from-rose-600 to-red-400" },
                ].map(({ term, color }, i) => (
                  <motion.button
                    key={term}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.05 + 0.2 }}
                    onClick={() => handleSearch(term)}
                    className={`group relative aspect-square md:aspect-[4/5] rounded-xl md:rounded-2xl bg-gradient-to-br ${color} p-2.5 md:p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-lg hover:shadow-xl overflow-hidden`}
                  >
                    {/* Background dynamic pattern */}
                    <div className="absolute -top-4 -right-4 w-16 md:w-20 h-16 md:h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="relative w-6 h-6 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg group-hover:rotate-12 transition-transform duration-500">
                      <Flame size={12} className="text-white fill-white md:w-[18px] md:h-[18px]" />
                    </div>
                    
                    <div className="relative">
                      <p className="text-[10px] md:text-base font-bold text-left text-white leading-tight drop-shadow-md">{term}</p>
                      <div className="hidden md:flex items-center gap-1 mt-1 text-[10px] text-white/80 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                        Search <ChevronRight size={10} />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          </div>
        )}

        <AnimatePresence mode="wait">
          {query && (
            <motion.div
              key={hasResults ? "results" : "no-results"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 md:space-y-10"
            >
              {!loading && !hasResults ? (
                <div className="text-center py-12 md:py-20 px-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--surface)] glass-card border border-[var(--border)] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl relative">
                    <div className="absolute inset-0 rounded-full bg-[var(--primary)]/10 animate-pulse" />
                    <Search size={24} className="text-[var(--muted)] relative z-10 md:w-8 md:h-8" />
                  </div>
                  <p className="text-white text-lg md:text-xl font-bold mb-2">No matches for "{query}"</p>
                  <p className="text-[var(--muted)] text-xs md:text-sm max-w-xs mx-auto">Try different keywords to find what you're looking for.</p>
                </div>
              ) : (
                <>
                  {/* Artists */}
                  {filteredArtists.length > 0 && (
                    <section className="animate-float-up">
                      <div className="flex items-center gap-2 mb-4">
                        <User size={16} className="text-purple-400 md:w-[18px] md:h-[18px]" />
                        <h2 className="text-base md:text-xl font-bold tracking-tight">Artists</h2>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 md:gap-4">
                        {filteredArtists.map((artist, i) => (
                          <motion.div
                            key={artist.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Link
                              href={artist.slug ? `/artist/${artist.slug}` : `/artist/${artist.id}`}
                              className="group flex flex-col items-center gap-2 transition-all duration-300"
                            >
                              <div className="w-full aspect-square rounded-full overflow-hidden bg-[var(--surface-3)] shadow-lg ring-2 ring-transparent group-hover:ring-[var(--primary)]/20 flex items-center justify-center text-base md:text-xl font-bold text-[var(--muted)] transition-all duration-300 group-hover:scale-105">
                                {artist.imageUrl ? (
                                  <Image src={artist.imageUrl} alt={artist.name} width={120} height={120} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                  artist.name[0]
                                )}
                              </div>
                              <div className="text-center w-full min-w-0">
                                <p className="text-[10px] md:text-sm font-semibold truncate group-hover:text-[var(--primary)] transition-colors leading-tight">
                                  {artist.name}
                                </p>
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Tracks */}
                  {filteredTracks.length > 0 && (
                    <section className="animate-float-up" style={{ animationDelay: "0.1s" }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Music size={16} className="text-[var(--primary)] md:w-[18px] md:h-[18px]" />
                        <h2 className="text-base md:text-xl font-bold tracking-tight">Songs</h2>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                        {filteredTracks.map((track, i) => (
                          <motion.div
                            key={track.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <TrackCard track={track} queue={filteredTracks} />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
