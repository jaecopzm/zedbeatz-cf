"use client";

import { Pause, Play, ListMusic, Shuffle, Music2, Heart, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePlayer, type Track } from "@/lib/player-store";
import { useLikes } from "@/lib/likes-context";
import "@/app/styles/collection-page.css";
import { TrackMenu } from "@/components/track-menu";

/* ─────────────────────────────────────────────
   Dominant-color extractor (canvas, client-only)
───────────────────────────────────────────────*/
function useDominantColor(src: string | undefined | null) {
  const [color, setColor] = useState<string>("60,60,80");

  useEffect(() => {
    if (!src) return;
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 64, 64);
        const { data } = ctx.getImageData(0, 0, 64, 64);
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          // Skip near-black and near-white pixels
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          const brightness = (pr + pg + pb) / 3;
          if (brightness < 20 || brightness > 235) continue;
          r += pr; g += pg; b += pb; count++;
        }
        if (count > 0) {
          setColor(`${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)}`);
        }
      } catch {
        // CORS issues — silently fall back
      }
    };
  }, [src]);

  return color;
}

/* ─────────────────────────────────────────────
   Animated equalizer bars
───────────────────────────────────────────────*/
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

/* ─────────────────────────────────────────────
   Format seconds → m:ss
───────────────────────────────────────────────*/
function fmtDuration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

/* ─────────────────────────────────────────────
   Track row
───────────────────────────────────────────────*/
function TrackRow({
  track,
  index,
  isCurrent,
  isPlaying,
  isPlaylistQueue,
  onPlay,
  style,
}: {
  track: Track & { duration?: number };
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isPlaylistQueue: boolean;
  onPlay: () => void;
  style?: React.CSSProperties;
}) {
  const { likedIds, toggleLike } = useLikes();
  const liked = likedIds.has(track.id);
  const [hovering, setHovering] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(track.id);
  };

  return (
    <div
      className={`track-row ${isCurrent ? "track-row--active" : ""}`}
      style={style}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={onPlay}
    >
      {/* Index / play icon */}
      <div className="track-index">
        <span className={`track-num ${isCurrent ? "track-num--current" : ""} ${hovering && !(isCurrent && isPlaying) ? "track-num--hidden" : ""}`}>
          {isCurrent && isPlaying ? (
            <EqBars active={true} />
          ) : (
            <>{isCurrent ? "▶" : index + 1}</>
          )}
        </span>
        <span className={`track-play-icon ${hovering && !(isCurrent && isPlaying) ? "track-play-icon--visible" : ""} ${isCurrent ? "track-play-icon--current" : ""}`}>
          {isCurrent && isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
        </span>
      </div>

      {/* Artwork + title */}
      <div className="track-info">
        <div className="track-thumb">
          {track.coverUrl ? (
            <Image
              src={track.coverUrl}
              alt={track.title}
              width={40}
              height={40}
              className="track-thumb-img"
            />
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
            {track.featuredArtists && (
              <span className="track-feat">, {track.featuredArtists}</span>
            )}
          </div>
        </div>
      </div>

      {/* Artist col (hidden on mobile) */}
      <div className="track-artist-col">
        <Link
          href={track.artistSlug ? `/artist/${track.artistSlug}` : track.artistId ? `/artist/${track.artistId}` : "/browse"}
          className="track-artist-link"
          onClick={(e) => e.stopPropagation()}
        >
          {track.featuredArtists ? `${track.artist} feat. ${track.featuredArtists}` : track.artist}
        </Link>
      </div>

      {/* Actions: like + duration + more */}
      <div className="track-actions">
        <button
          className={`track-like ${liked ? "track-like--active" : ""}`}
          onClick={handleLike}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart size={15} fill={liked ? "currentColor" : "none"} />
        </button>
        {fmtDuration(track.duration) && (
          <span className="track-duration">{fmtDuration(track.duration)}</span>
        )}
        <div className={hovering ? "track-more--visible" : ""} onClick={(e) => e.stopPropagation()}>
          <TrackMenu track={track} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────────*/
export default function PlaylistPageClient({
  playlist,
  tracks,
}: {
  playlist: any;
  tracks: (Track & { duration?: number })[];
}) {
  const { queue, currentIndex, playing, shuffle, toggle, setQueue, toggleShuffle } = usePlayer();
  const dominantColor = useDominantColor(playlist.coverUrl);

  const isPlaylistQueue =
    queue.length === tracks.length && tracks.every((t, i) => queue[i]?.id === t.id);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space" && isPlaylistQueue) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaylistQueue, toggle]);

  const handlePlayAll = useCallback(() => {
    if (!tracks.length) return;
    if (isPlaylistQueue) toggle();
    else setQueue(tracks, 0, { label: playlist.name, href: `/playlist/${playlist.id}` });
  }, [tracks, isPlaylistQueue, toggle, setQueue, playlist]);

  const currentTrack = queue[currentIndex] ?? null;

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

      <div className="relative">
    
      {/* ── Dynamic color theming ── */}
      <style>{`
        :root {
          --accent-r: ${dominantColor};
          --accent: rgb(${dominantColor});
          --accent-dim: rgba(${dominantColor}, 0.18);
          --accent-glow: rgba(${dominantColor}, 0.35);
        }

        .collection-hero-bg {
          background: rgb(${dominantColor});
        }
        .collection-actions {
          background: linear-gradient(to bottom, rgba(${dominantColor}, 0.18) 0%, transparent 100%);
        }
      `}</style>

      {/* ── Sticky header ── */}
      <header className={`collection-sticky-header ${headerVisible ? "collection-sticky-header--visible" : ""}`}>
        <div className="collection-sticky-thumb">
          {playlist.coverUrl && (
            <img src={playlist.coverUrl} alt={playlist.name} />
          )}
        </div>
        <span className="collection-sticky-title">{playlist.name}</span>
        <button
          className="collection-play-btn"
          onClick={handlePlayAll}
          disabled={!tracks.length}
          aria-label={isPlaylistQueue && playing ? "Pause" : "Play"}
        >
          {isPlaylistQueue && playing ? (
            <Pause size={14} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
          {isPlaylistQueue && playing ? "Pause" : "Play"}
        </button>
      </header>

      {/* ── Hero ── */}
      <div className="collection-hero" ref={heroRef}>
        <div className="collection-hero-bg" />
        <div className="collection-hero-content">
          {/* Cover */}
          <div className="collection-cover">
            {playlist.coverUrl ? (
              <Image
                src={playlist.coverUrl}
                alt={playlist.name}
                width={232}
                height={232}
                unoptimized
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ListMusic size={56} style={{ color: "rgba(255,255,255,0.2)" }} />
              </div>
            )}
          </div>

          {/* Text */}
          <div className="collection-hero-text">
            <p className="collection-hero-eyebrow">
              Playlist{playlist.category ? ` · ${playlist.category}` : ""}
            </p>
            <h1 className="collection-hero-title">{playlist.name}</h1>
            {playlist.description && (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 10, maxWidth: 480, lineHeight: 1.5 }}>
                {playlist.description}
              </p>
            )}
            <p className="collection-hero-meta">
              {tracks.length} track{tracks.length !== 1 ? "s" : ""}
              {playlist.createdBy ? ` · by ${playlist.createdBy}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <section className="collection-actions relative z-10">
        <div className="flex items-center gap-2">
          <button
            className="collection-play-btn"
            onClick={handlePlayAll}
            disabled={!tracks.length}
          >
            {isPlaylistQueue && playing ? (
              <Pause size={15} fill="currentColor" />
            ) : (
              <Play size={15} fill="currentColor" />
            )}
            {isPlaylistQueue && playing ? "Pause" : "Play"}
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
            const url = `${window.location.origin}/playlist/${playlist.id}`;
            if (navigator.share) {
              navigator.share({ title: playlist.name, text: `Check out ${playlist.name} playlist`, url });
            } else {
              navigator.clipboard.writeText(url);
            }
          }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ml-auto"
          title="Share playlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </section>

      {/* ── Track list ── */}
      <section className="collection-tracklist relative z-10">
        <div className="collection-tracklist-inner">
          {/* Column headers */}
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
              const isCurrent = isPlaylistQueue && i === currentIndex;
              return (
                <TrackRow
                  key={`${t.id}-${i}`}
                  track={t}
                  index={i}
                  isCurrent={isCurrent}
                  isPlaying={playing}
                  isPlaylistQueue={isPlaylistQueue}
                  onPlay={() => {
                    if (isCurrent) toggle();
                    else setQueue(tracks, i, { label: playlist.name, href: `/playlist/${playlist.id}` });
                  }}
                  style={{ animationDelay: `${i * 0.035}s` }}
                />
              );
            })}
          </div>
        ) : (
          <div className="collection-empty">
            <ListMusic size={44} />
            <p>No tracks in this playlist yet.</p>
          </div>
        )}
        </div>
      </section>
      </div>
    </div>
  );
}