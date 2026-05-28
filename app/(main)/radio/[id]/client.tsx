"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";
import { useLikes } from "@/lib/likes-context";
import { X, Play, Pause, SkipForward, Radio, Music2, RefreshCw, Shuffle, MoreHorizontal, Heart } from "lucide-react";
import "@/app/styles/collection-page.css";
import { TrackMenu } from "@/components/track-menu";

type SeedTrack = Track & { genre?: string; artist_id: number };

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function EqBars({ active }: { active: boolean }) {
  return (
    <span className="eq-container" aria-hidden>
      {[0.3, 0.7, 0.5, 0.9, 0.4].map((delay, i) => (
        <span
          key={i}
          className={`eq-bar ${active ? "eq-bar--active" : ""}`}
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}

function TrackRow({
  track,
  index,
  isCurrent,
  isPlaying,
  onPlay,
}: {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const { likedIds, toggleLike } = useLikes();
  const liked = likedIds.has(track.id);
  const [hovering, setHovering] = React.useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(track.id);
  };

  return (
    <div
      className={`track-row ${isCurrent ? "track-row--active" : ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={onPlay}
    >
      <div className="track-index">
        <span className={`track-num ${isCurrent ? "track-num--current" : ""} ${hovering && !(isCurrent && isPlaying) ? "track-num--hidden" : ""}`}>
          {isCurrent && isPlaying ? <EqBars active={true} /> : <>{isCurrent ? "▶" : index + 1}</>}
        </span>
        <span className={`track-play-icon ${hovering && !(isCurrent && isPlaying) ? "track-play-icon--visible" : ""} ${isCurrent ? "track-play-icon--current" : ""}`}>
          {isCurrent && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </span>
      </div>

      <div className="track-info">
        <div className="track-thumb">
          {track.coverUrl ? (
            <Image src={track.coverUrl} alt={track.title} width={40} height={40} className="track-thumb-img" />
          ) : (
            <div className="track-thumb-fallback">
              <Music2 size={16} />
            </div>
          )}
        </div>
        <div className="track-meta">
          <span className={`track-title ${isCurrent ? "track-title--current" : ""}`}>
            {track.title}
          </span>
          <div className="track-sub">
            <Link
              href={track.artistSlug ? `/artist/${track.artistSlug}` : track.artistId ? `/artist/${track.artistId}` : "/browse"}
              className="track-artist"
              onClick={(e) => e.stopPropagation()}
            >
              {track.artist}
            </Link>
            {track.featuredArtists && <span className="track-feat">, {track.featuredArtists}</span>}
          </div>
        </div>
      </div>

      <div className="track-artist-col">
        <Link
          href={track.artistSlug ? `/artist/${track.artistSlug}` : track.artistId ? `/artist/${track.artistId}` : "/browse"}
          className="track-artist-link"
          onClick={(e) => e.stopPropagation()}
        >
          {track.featuredArtists ? `${track.artist} feat. ${track.featuredArtists}` : track.artist}
        </Link>
      </div>

      <div className="track-actions">
        <button
          className={`track-like ${liked ? "track-like--active" : ""} track-like--visible`}
          onClick={handleLike}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart size={15} fill={liked ? "currentColor" : "none"} />
        </button>
        {formatDuration(track.duration) && (
          <span className="track-duration">{formatDuration(track.duration)}</span>
        )}
        <div className={hovering ? "track-more--visible" : ""} onClick={(e) => e.stopPropagation()}>
          <TrackMenu track={track} />
        </div>
      </div>
    </div>
  );
}

export default function RadioClient({ seedTrack }: { seedTrack: SeedTrack }) {
  const router = useRouter();
  const { queue, currentIndex, playing, shuffle, toggle, next, setQueue, toggleShuffle } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [radioTracks, setRadioTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetchingMore, setFetchingMore] = useState(false);
  const startAbortRef = useRef<AbortController | null>(null);
  const moreAbortRef = useRef<AbortController | null>(null);
  const requestKeyRef = useRef(0);
  
  const isRadioQueue = radioTracks.length > 0 && queue.some(t => t.id === seedTrack.id) && queue.length >= radioTracks.length - 5;
  const currentTrack = isRadioQueue ? queue[currentIndex] : null;
  const upcomingTracks = isRadioQueue ? queue.slice(currentIndex + 1, currentIndex + 6) : [];
  const heroRef = useRef<HTMLElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHeaderVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);
  const stationSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (seedTrack.genre) parts.push(seedTrack.genre);
    parts.push(`more like ${seedTrack.artist}`);
    return parts.join(" • ");
  }, [seedTrack.artist, seedTrack.genre]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space" && isRadioQueue) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isRadioQueue, toggle]);

  function appendToQueue(tracks: Track[]) {
    if (!tracks.length) return;
    usePlayer.setState((s) => {
      const existing = new Set(s.queue.map((t) => t.id));
      const deduped = tracks.filter((t) => !existing.has(t.id));
      if (!deduped.length) return s;
      return { ...s, queue: [...s.queue, ...deduped] };
    });
  }

  useEffect(() => {
    if (radioTracks.length > 0) return;
    
    const startRadio = async () => {
      const key = ++requestKeyRef.current;
      setLoading(true);
      setError(null);
      startAbortRef.current?.abort();
      const ac = new AbortController();
      startAbortRef.current = ac;
      try {
        const res = await fetch(`/api/radio?trackId=${seedTrack.id}&take=25`, { signal: ac.signal });
        if (!res.ok) throw new Error(`radio_fetch_failed_${res.status}`);
        const data = await res.json();
        
        if (data.tracks && data.tracks.length > 0) {
          setRadioTracks([seedTrack, ...data.tracks]);
        } else {
          setRadioTracks([seedTrack]);
        }
      } catch (error) {
        if ((error as any)?.name === "AbortError") return;
        if (key !== requestKeyRef.current) return;
        console.error("Failed to start radio:", error);
        setError("Couldn’t start this station. Please try again.");
      } finally {
        if (key !== requestKeyRef.current) return;
        setLoading(false);
      }
    };

    startRadio();
  }, [seedTrack, setQueue, radioTracks.length]);

  // Prefetch more when we're near the end.
  useEffect(() => {
    if (!isRadioQueue) return;
    if (loading || fetchingMore) return;
    const remaining = queue.length - (currentIndex + 1);
    if (remaining > 6) return;

    const fetchMore = async () => {
      setFetchingMore(true);
      moreAbortRef.current?.abort();
      const ac = new AbortController();
      moreAbortRef.current = ac;

      const exclude = queue.map((t) => t.id).join(",");
      try {
        const res = await fetch(
          `/api/radio?trackId=${seedTrack.id}&take=25&exclude=${encodeURIComponent(exclude)}`,
          { signal: ac.signal }
        );
        if (!res.ok) throw new Error(`radio_more_failed_${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.tracks) && data.tracks.length) {
          appendToQueue(data.tracks);
        }
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
      } finally {
        setFetchingMore(false);
      }
    };

    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRadioQueue, currentIndex, queue.length]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black overflow-hidden pb-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/25 via-black to-black" />
        </div>

        <section className="relative px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-4 sm:pb-6 md:pb-8 max-w-6xl mx-auto">
          <div className="flex items-start gap-3 sm:gap-5 md:gap-6">
            <div className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 shrink-0 rounded-lg sm:rounded-2xl overflow-hidden bg-white/5 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
              <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
              <div className="flex gap-2 mt-4">
                <div className="h-10 w-24 bg-white/5 rounded-full animate-pulse" />
                <div className="h-10 w-24 bg-white/5 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        <section className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="space-y-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg">
                <div className="w-5 h-4 bg-white/5 rounded animate-pulse" />
                <div className="w-10 h-10 bg-white/5 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-b from-purple-900/20 via-black to-black flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-7 h-7 text-white/70" />
          </div>
          <p className="text-white/80 text-lg font-semibold mb-2">Radio unavailable</p>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setRadioTracks([]); setLoading(true); }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayTracks = isRadioQueue ? queue : radioTracks;

  return (
    <div className="relative min-h-screen bg-black overflow-hidden pb-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/25 via-black to-black" />
        {currentTrack?.coverUrl && (
          <div
            key={currentTrack.id}
            className="absolute inset-0 opacity-20 transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${currentTrack.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(120px)",
            }}
          />
        )}
      </div>

      {/* Sticky header */}
      <header className={`collection-sticky-header ${headerVisible ? "collection-sticky-header--visible" : ""}`}>
        <div className="collection-sticky-thumb">
          {seedTrack.coverUrl && <img src={seedTrack.coverUrl} alt={seedTrack.title} />}
        </div>
        <span className="collection-sticky-title">{seedTrack.artist} Radio</span>
        <button
          className="collection-play-btn"
          onClick={() => isRadioQueue ? toggle() : setQueue(radioTracks, 0, { label: `${seedTrack.artist} Radio`, href: `/radio/${seedTrack.id}` })}
        >
          {isRadioQueue && playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          {isRadioQueue && playing ? "Pause" : "Play"}
        </button>
      </header>

      {/* Spotify-like playlist header */}
      <section ref={heroRef} className="relative px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-4 sm:pb-6 md:pb-8 max-w-6xl mx-auto">
        <div className="flex items-start gap-3 sm:gap-5 md:gap-6">
          <div className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 shrink-0 rounded-lg sm:rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-2xl">
            {seedTrack.coverUrl ? (
              <Image src={seedTrack.coverUrl} alt={seedTrack.title} fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 className="w-8 h-8 sm:w-10 sm:h-10 text-white/15" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-white/50 mb-1 sm:mb-2">
              Playlist
            </p>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              {seedTrack.artist} Radio
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-white/50 mt-1 sm:mt-2">
              {stationSubtitle}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-5">
              <button
                onClick={() => {
                  if (isRadioQueue) {
                    toggle();
                  } else {
                    setQueue(radioTracks, 0, { label: `${seedTrack.artist} Radio`, href: `/radio/${seedTrack.id}` });
                  }
                }}
                className="collection-play-btn"
              >
                {isRadioQueue && playing ? (
                  <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" />
                ) : (
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" fill="currentColor" />
                )}
                {isRadioQueue && playing ? "Pause" : "Play"}
              </button>
              <button
                onClick={toggleShuffle}
                className={`collection-shuffle-btn ${shuffle ? "collection-shuffle-btn--active" : ""}`}
                aria-pressed={shuffle}
              >
                <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Shuffle</span>
              </button>
              <button
                onClick={next}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs sm:text-sm font-black transition-all"
              >
                <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Next</span>
              </button>
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/radio/${seedTrack.id}`;
                  if (navigator.share) {
                    navigator.share({ title: `${seedTrack.artist} Radio`, text: `Listen to ${seedTrack.artist} Radio`, url });
                  } else {
                    navigator.clipboard.writeText(url);
                  }
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Share radio"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              <button
                onClick={() => router.back()}
                className="ml-auto inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-white/0 hover:bg-white/5 text-white/70 hover:text-white text-xs sm:text-sm transition-all"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Track list */}
      <section className="collection-tracklist">
        <div className="collection-tracklist-inner">
          <div className="collection-col-header">
            <span className="col-num">#</span>
            <span>Title</span>
            <span className="col-artist">Artist</span>
            <span className="col-dur" style={{ textAlign: "right" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle", opacity: 0.5 }}>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          <div>
            {displayTracks.map((t, i) => {
              const isCurrent = isRadioQueue && i === currentIndex;
              return (
                <TrackRow
                  key={`${t.id}-${i}`}
                  track={t}
                  index={i}
                  isCurrent={isCurrent}
                  isPlaying={isRadioQueue && playing}
                  onPlay={() => setQueue(displayTracks, i, { label: `${seedTrack.artist} Radio`, href: `/radio/${seedTrack.id}` })}
                />
              );
            })}
          </div>

          {fetchingMore && (
            <div style={{ padding: "12px", fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 600, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              Fetching more tracks…
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
