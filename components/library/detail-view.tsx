"use client";

import { ChevronLeft, Heart, Clock, Music, Play, Pause, Shuffle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";
import "@/app/styles/collection-page.css";

export function LibraryDetailView({ 
  selected, 
  selectedName, 
  selectedCount, 
  selectedFull, 
  tracks, 
  isSignedIn, 
  setQueue, 
  removeTrack, 
  goBack,
  children
}: any) {
  const { playing, toggle, currentIndex, queue } = usePlayer();
  const isPlaylistQueue = queue.length === tracks.length && tracks.every((t: Track, i: number) => queue[i]?.id === t.id);
  const playingTrack = queue[currentIndex] ?? null;
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

  return (
    <div className="relative min-h-screen bg-black overflow-hidden pb-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/25 via-black to-black" />
        {playingTrack?.coverUrl && (
          <div
            key={playingTrack.id}
            className="absolute inset-0 opacity-20 transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${playingTrack.coverUrl})`,
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
          {selectedFull?.cover_url ? (
            <img src={selectedFull.cover_url} alt={selectedName} />
          ) : selected === "liked" ? (
            <div className="w-full h-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Heart size={18} className="text-white" fill="white" />
            </div>
          ) : selected === "recent" ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Clock size={18} className="text-white" />
            </div>
          ) : null}
        </div>
        <span className="collection-sticky-title">{selectedName}</span>
        <button
          className="collection-play-btn"
          onClick={() => isPlaylistQueue ? toggle() : setQueue(tracks, 0, { label: selectedName })}
          disabled={!tracks.length}
        >
          {isPlaylistQueue && playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          {isPlaylistQueue && playing ? "Pause" : "Play"}
        </button>
      </header>

      {/* Hero */}
      <div className="collection-hero relative" ref={heroRef}>
        <button 
          onClick={goBack} 
          className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
        >
          <ChevronLeft size={18} className="text-white" />
        </button>
        <div className="collection-hero-bg" style={{ 
          background: selected === "liked" 
            ? "linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)" 
            : selected === "recent"
            ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        }} />
        <div className="collection-hero-content">
          <div className="collection-cover">
            {selectedFull?.cover_url ? (
              <Image src={selectedFull.cover_url} alt={selectedName} width={232} height={232} unoptimized />
            ) : selected === "liked" ? (
              <div className="w-full h-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Heart size={56} className="text-white" fill="white" />
              </div>
            ) : selected === "recent" ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Clock size={56} className="text-white" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music size={56} className="text-white/20" />
              </div>
            )}
          </div>

          <div className="collection-hero-text">
            <p className="collection-hero-eyebrow">
              {selected === "liked" ? "Liked Songs" : selected === "recent" ? "Recently Played" : "Playlist"}
            </p>
            <h1 className="collection-hero-title">{selectedName}</h1>
            <p className="collection-hero-meta">{selectedCount} track{selectedCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <section className="collection-actions relative z-10">
        <button 
          className="collection-play-btn" 
          onClick={() => isPlaylistQueue ? toggle() : setQueue(tracks, 0, { label: selectedName })}
          disabled={!tracks.length}
        >
          {isPlaylistQueue && playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          {isPlaylistQueue && playing ? "Pause" : "Play"}
        </button>
        <button 
          className="collection-shuffle-btn"
          onClick={() => setQueue([...tracks].sort(() => Math.random() - 0.5), 0, { label: selectedName })}
          disabled={!tracks.length}
        >
          <Shuffle size={15} />
          Shuffle
        </button>
      </section>

      {/* Track list */}
      <section className="collection-tracklist relative z-10">
        <div className="collection-tracklist-inner">
          {tracks.length === 0 ? (
            <div className="collection-empty">
              <Music size={44} />
              <p>No tracks yet</p>
              <Link href="/browse" className="mt-4 px-6 py-2.5 bg-[var(--primary)] text-black rounded-full font-bold text-sm no-underline">
                Browse Music
              </Link>
            </div>
          ) : (
            <>
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
              <div>{children}</div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
