"use client";

import { Pause, Play, Shuffle, Music2, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePlayer, type Track } from "@/lib/player-store";
import { useLikes } from "@/lib/likes-context";
import "@/app/styles/collection-page.css";
import { TrackMenu } from "@/components/track-menu";
import { encodeId } from "@/lib/hashids";

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

function fmtDuration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
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
  const [hovering, setHovering] = useState(false);

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
              href={track.artistId ? `/artist/${encodeId(track.artistId)}` : "/browse"}
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
          href={track.artistId ? `/artist/${encodeId(track.artistId)}` : "/browse"}
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
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
        </button>
        <span className="track-duration">{fmtDuration(track.duration)}</span>
        <div className={hovering ? "track-more--visible" : ""}>
          <TrackMenu track={track} />
        </div>
      </div>
    </div>
  );
}

export default function GenrePageClient({
  genreName,
  tracks,
}: {
  genreName: string;
  tracks: Track[];
}) {
  const { queue, currentIndex, playing, shuffle, setQueue, toggle, toggleShuffle } = usePlayer();
  const currentTrack = queue[currentIndex] ?? null;
  const heroRef = useRef<HTMLDivElement>(null);
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

  const isPlayingFromGenre = tracks.some(t => t.id === currentTrack?.id);

  function playGenre(startIndex = 0) {
    if (!tracks.length) return;
    const clickedTrack = tracks[startIndex];
    if (currentTrack?.id === clickedTrack?.id) {
      toggle();
    } else {
      setQueue(tracks, startIndex, { label: genreName });
    }
  }

  function handlePlayButton() {
    if (!tracks.length) return;
    if (isPlayingFromGenre) {
      toggle();
    } else {
      setQueue(tracks, 0, { label: genreName });
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && isPlayingFromGenre) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingFromGenre, toggle]);

  if (tracks.length === 0) {
    return (
      <div className="relative min-h-screen bg-background overflow-hidden pb-6">
        <div className="collection-hero relative" ref={heroRef}>
          <div className="collection-hero-bg" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }} />
          <div className="collection-hero-content">
            <div className="collection-cover">
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Music2 size={56} style={{ color: "rgba(255,255,255,0.2)" }} />
              </div>
            </div>
            <div className="collection-hero-text">
              <p className="collection-hero-eyebrow">Genre</p>
              <h1 className="collection-hero-title">{genreName}</h1>
              <p className="collection-hero-meta">0 tracks</p>
            </div>
          </div>
        </div>
        <section className="collection-tracklist relative z-10">
          <div className="collection-tracklist-inner">
            <div className="collection-empty">
              <Music2 size={44} />
              <p>No tracks found for this genre</p>
              <Link href="/browse" style={{ fontSize: "13px", color: "var(--primary)", marginTop: "8px" }}>
                Browse music →
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden pb-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/25 via-background/80 to-background" />
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
        <div className="collection-sticky-thumb flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
          {tracks[0]?.coverUrl ? (
            <Image src={tracks[0].coverUrl} alt={genreName} width={44} height={44} className="w-full h-full object-cover" unoptimized />
          ) : (
            <Music2 size={18} className="text-white/80" />
          )}
        </div>
        <span className="collection-sticky-title">{genreName}</span>
        <div className="flex items-center gap-2">
          <button className="collection-play-btn" onClick={handlePlayButton} disabled={!tracks.length}>
            {isPlayingFromGenre && playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            {isPlayingFromGenre && playing ? "Pause" : "Play"}
          </button>
        </div>
      </header>

      <div className="collection-hero relative" ref={heroRef}>
        <div className="collection-hero-bg" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }} />
        <div className="collection-hero-content">
          <div className="collection-cover">
            {tracks[0]?.coverUrl ? (
              <Image src={tracks[0].coverUrl} alt={genreName} width={232} height={232} unoptimized />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, rgba(102,126,234,0.5), rgba(118,75,162,0.5))" }}>
                <Music2 size={56} style={{ color: "rgba(255,255,255,0.6)" }} />
              </div>
            )}
          </div>
          <div className="collection-hero-text">
            <p className="collection-hero-eyebrow">Genre</p>
            <h1 className="collection-hero-title">{genreName}</h1>
            <p className="collection-hero-meta">
              {tracks.length} track{tracks.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <section className="collection-actions relative z-10">
        <div className="flex items-center gap-2">
          <button className="collection-play-btn" onClick={handlePlayButton} disabled={!tracks.length}>
            {isPlayingFromGenre && playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            {isPlayingFromGenre && playing ? "Pause" : "Play"}
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
            const url = `${window.location.origin}/genre/${encodeURIComponent(genreName.toLowerCase().replace(/\s+/g, '-'))}`;
            if (navigator.share) {
              navigator.share({ title: genreName, text: `Check out ${genreName} music on ZedBeatz`, url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(url);
            }
          }}
          className="w-10 h-10 rounded-full bg-[var(--glass-hover)] hover:bg-[var(--surface-2)] flex items-center justify-center transition-colors ml-auto"
          title="Share genre"
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
                  onPlay={() => playGenre(i)}
                />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}