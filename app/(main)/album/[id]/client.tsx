"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";
import { useLikes } from "@/lib/likes-context";
import { Pause, Play, Shuffle, Music2, Heart, MoreHorizontal, Headphones } from "lucide-react";
import "@/app/styles/collection-page.css";
import { TrackMenu } from "@/components/track-menu";

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
  const [hovering, setHovering] = React.useState(false);
  const [liking, setLiking] = React.useState(false);
  const { isLiked, toggleLike } = useLikes();
  const liked = isLiked(track.id);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    await toggleLike(track.id);
    setLiking(false);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`track-row ${isCurrent ? "track-row--active" : ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={onPlay}
    >
      <div className="track-index" onClick={(e) => { e.stopPropagation(); onPlay(); }}>
        <span className={`track-num ${isCurrent ? "track-num--current" : ""} ${hovering && !isPlaying ? "track-num--hidden" : ""}`}>
          {isCurrent && isPlaying ? <EqBars active={true} /> : <>{isCurrent ? "▶" : index + 1}</>}
        </span>
        <span className={`track-play-icon ${hovering && !isPlaying ? "track-play-icon--visible" : ""} ${isCurrent ? "track-play-icon--current" : ""}`}>
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
          <div className={`track-title ${isCurrent ? "track-title--current" : ""}`}>
            {track.title}
          </div>
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
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          disabled={liking}
          aria-label={liked ? "Unlike" : "Like"}
          style={{ opacity: liking ? 0.5 : 1 }}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
        </button>
        <span className="track-duration">{formatDuration(track.duration)}</span>
        <div className={hovering ? "track-more--visible" : ""}>
          <TrackMenu track={track} />
        </div>
      </div>
    </div>
  );
}

export default function AlbumClient({
  album,
  tracks,
  totalPlays,
}: {
  album: {
    id: number;
    title: string;
    slug?: string | null;
    artistName: string;
    artistSlug?: string | null;
    coverUrl?: string | null;
    releaseYear?: number | null;
  };
  tracks: Track[];
  totalPlays?: number;
}) {
  const { queue, currentIndex, playing, shuffle, toggle, setQueue, toggleShuffle } = usePlayer();
  
  const currentTrack = queue[currentIndex] ?? null;
  const heroRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  // Sticky header logic
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

  const isAlbumQueue = useMemo(() => {
    if (!tracks.length) return false;
    if (queue.length !== tracks.length) return false;
    for (let i = 0; i < tracks.length; i++) {
      if (queue[i]?.id !== tracks[i]?.id) return false;
    }
    return true;
  }, [queue, tracks]);

  const totalDuration = useMemo(() => {
    const total = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    if (hours > 0) return `${hours} hr ${mins} min`;
    return `${mins} min`;
  }, [tracks]);

  const isPlayingFromAlbum = useMemo(() => {
    return tracks.some(t => t.id === currentTrack?.id);
  }, [tracks, currentTrack]);

  // Keyboard shortcut: Space to play/pause
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && isPlayingFromAlbum) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingFromAlbum, toggle]);

  function playAlbum(startIndex = 0) {
    if (!tracks.length) return;
    const clickedTrack = tracks[startIndex];
    // If clicking the currently playing track, just toggle play/pause
    if (currentTrack?.id === clickedTrack?.id) {
      toggle();
    } else {
      // Otherwise, set the queue and start playing from that track
      setQueue(tracks, startIndex, { label: album.title });    }
  }

  function handlePlayButton() {
    if (!tracks.length) return;
    // If any track from this album is playing, toggle it
    if (isPlayingFromAlbum) {
      toggle();
    } else {
      // Otherwise start from the beginning
      setQueue(tracks, 0, { label: album.title });
    }
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden pb-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 z-0">
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

      <header className={`collection-sticky-header ${headerVisible ? "collection-sticky-header--visible" : ""}`}>
        <div className="collection-sticky-thumb">
          {album.coverUrl && <img src={album.coverUrl} alt={album.title} />}
        </div>
        <span className="collection-sticky-title">{album.title}</span>
        <div className="flex items-center gap-2">
          <button className="collection-play-btn" onClick={handlePlayButton} disabled={!tracks.length}>
            {isPlayingFromAlbum && playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            {isPlayingFromAlbum && playing ? "Pause" : "Play"}
          </button>
          <button 
            onClick={() => {
              const url = `${window.location.origin}/album/${album.slug || album.id}`;
              if (navigator.share) {
                navigator.share({ title: album.title, text: `Check out ${album.title} by ${album.artistName}`, url });
              } else {
                navigator.clipboard.writeText(url);
              }
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Share album"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="collection-hero relative" ref={heroRef}>
        <div className="collection-hero-bg" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }} />
        <div className="collection-hero-content">
          <div className="collection-cover">
            {album.coverUrl ? (
              <Image src={album.coverUrl} alt={album.title} width={232} height={232} unoptimized />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Music2 size={56} style={{ color: "rgba(255,255,255,0.2)" }} />
              </div>
            )}
          </div>
          <div className="collection-hero-text">
            <p className="collection-hero-eyebrow">Album{album.releaseYear ? ` · ${album.releaseYear}` : ""}</p>
            <h1 className="collection-hero-title">{album.title}</h1>
            <p className="collection-hero-meta">
              <Link href={album.artistSlug ? `/artist/${album.artistSlug}` : "/browse"} style={{ color: "inherit", fontWeight: 700 }}>
                {album.artistName}
              </Link>
              {" · "}
              {tracks.length} track{tracks.length !== 1 ? "s" : ""}
              {tracks.length > 0 && (
                <>
                  {" · "}
                  {totalDuration}
                </>
              )}
              {totalPlays && totalPlays > 0 && (
                <>
                  {" · "}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", verticalAlign: "middle" }}>
                    <Headphones size={13} style={{ verticalAlign: "middle" }} />
                    {totalPlays.toLocaleString()}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <section className="collection-actions relative z-10">
        <div className="flex items-center gap-2">
          <button className="collection-play-btn" onClick={handlePlayButton} disabled={!tracks.length}>
            {isPlayingFromAlbum && playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            {isPlayingFromAlbum && playing ? "Pause" : "Play"}
          </button>
          <button
            className={`collection-shuffle-btn ${shuffle ? "collection-shuffle-btn--active" : ""}`}
            onClick={toggleShuffle}
            aria-pressed={shuffle}
          >
            <Shuffle size={15} />
            Shuffle
          </button>
        </div>
        <button 
          onClick={() => {
            const url = `${window.location.origin}/album/${album.slug || album.id}`;
            if (navigator.share) {
              navigator.share({ title: album.title, text: `Check out ${album.title} by ${album.artistName}`, url });
            } else {
              navigator.clipboard.writeText(url);
            }
          }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ml-auto"
          title="Share album"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </section>

      <section className="collection-tracklist relative z-10">
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

          {tracks.length ? (
            <div>
              {tracks.map((t, i) => {
                const isCurrent = currentTrack?.id === t.id;
                return (
                  <TrackRow
                    key={`${t.id}-${i}`}
                    track={t}
                    index={i}
                    isCurrent={isCurrent}
                    isPlaying={playing}
                    onPlay={() => playAlbum(i)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="collection-empty">
              <Music2 size={44} />
              <p>No tracks available</p>
              <Link href="/browse" style={{ fontSize: "13px", color: "var(--primary)", marginTop: "8px" }}>
                Browse music →
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

