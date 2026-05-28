"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

type FeaturedAlbum = {
  id: number;
  title: string;
  slug: string | null;
  releaseYear: number | null;
  artistName: string;
  artistSlug: string | null;
  coverUrl: string | null;
};

function HeroCard({
  track,
  isActive,
  playing,
  onPlay,
}: {
  track: Track;
  isActive: boolean;
  playing: boolean;
  onPlay: () => void;
}) {
  return (
    <div className="relative w-full shrink-0 snap-start overflow-hidden">
      <div
        onClick={onPlay}
        role="button"
        tabIndex={0}
        className="relative w-full min-h-[140px] md:min-h-[380px] flex items-center text-left cursor-pointer active:scale-[0.98] transition-transform"
      >
        {/* Blurred backdrop */}
        {track.coverUrl ? (
          <Image
            src={track.coverUrl}
            alt=""
            fill
            className="object-cover blur-xl scale-105 opacity-60 pointer-events-none"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface)]" />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[var(--background)]/40" />

        {/* Content */}
        <div className="relative z-10 w-full flex flex-row items-center gap-3 md:gap-10 px-4 md:px-10">
          {/* Artwork */}
          {track.coverUrl && (
            <div className="relative w-16 h-16 md:w-48 md:h-48 shrink-0 rounded-lg md:rounded-xl overflow-hidden shadow-lg md:shadow-2xl ring-1 ring-white/10 pointer-events-none">
              <Image
                src={track.coverUrl}
                alt={track.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 64px, 192px"
              />
            </div>
          )}

          {/* Text & actions */}
          <div className="min-w-0 text-left pointer-events-none">
            <p className="hidden md:block text-[11px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2">
              Featured Track
            </p>
            <h2 className="text-sm md:text-5xl font-black text-white leading-tight max-w-2xl drop-shadow-sm line-clamp-2 md:line-clamp-none">
              {track.title}
            </h2>
            <p className="text-[11px] md:text-lg text-white/60 mt-0.5 md:mb-5 max-w-xl truncate md:line-clamp-none">
              <span className="font-semibold text-white/85">{track.artist}</span>
              {track.featuredArtists && <span className="text-white/40"> feat. {track.featuredArtists}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop buttons */}
      <div className="hidden md:flex absolute bottom-5 right-10 z-20 items-center gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="inline-flex items-center gap-2.5 px-7 py-3 bg-[var(--primary)] text-black rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--primary-glow)]"
        >
          {isActive && playing ? (
            <><Pause size={16} fill="currentColor" />Pause</>
          ) : (
            <><Play size={16} fill="currentColor" className="ml-0.5" />Play</>
          )}
        </button>
        <Link
          href={track.slug ? `/track/${track.slug}` : `/track/${track.id}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/15 text-white rounded-full font-semibold text-sm transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          View Track
        </Link>
      </div>
    </div>
  );
}

export default function HeroSection({ tracks, featuredAlbum }: { tracks: Track[]; featuredAlbum?: FeaturedAlbum | null }) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const [activeIndex, setActiveIndex] = useState(0);
  const track = tracks[activeIndex] ?? tracks[0];
  const isActive = queue[currentIndex]?.id === track?.id;

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const goNext = useCallback(() => {
    if (tracks.length > 0) setActiveIndex((prev) => (prev + 1) % tracks.length);
  }, [tracks.length]);

  const goPrev = useCallback(() => {
    if (tracks.length > 0) setActiveIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  useEffect(() => {
    if (tracks.length <= 1) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [goNext, tracks.length]);

  if (!track || tracks.length === 0) {
    return (
      <section className="mx-4 md:mx-8 mb-6 md:mb-10 rounded-2xl bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] border border-[var(--border)] overflow-hidden" style={{ minHeight: "320px" }}>
        <div className="flex flex-col items-center justify-center text-center h-full min-h-[320px]">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Play size={24} className="text-white/40 ml-1" />
          </div>
          <h2 className="text-xl md:text-2xl font-black mb-2 text-white">Ready to Play</h2>
          <p className="text-white/50 max-w-md text-sm">Check your connection to see the latest hits</p>
        </div>
      </section>
    );
  }

  function handlePlay() {
    if (isActive) toggle();
    else setQueue(tracks, activeIndex, { label: "Featured", href: "/" });
  }

  return (
    <section className="group/hero relative mx-4 md:mx-8 mb-6 md:mb-10 rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]">
      {/* Carousel */}
      <div className="relative">
        <div className="flex overflow-x-hidden snap-x snap-mandatory">
          {tracks.map((t, i) => (
            <div
              key={t.id}
              className="w-full shrink-0 snap-start"
              style={{ display: i === activeIndex ? "block" : "none" }}
            >
              <HeroCard
                track={t}
                isActive={queue[currentIndex]?.id === t.id}
                playing={playing}
                onPlay={() => {
                  if (queue[currentIndex]?.id === t.id) toggle();
                  else setQueue(tracks, i, { label: "Featured", href: "/" });
                }}
              />
            </div>
          ))}
        </div>

        {/* Nav arrows - desktop only */}
        {tracks.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center text-white/80 hover:bg-black/80 hover:text-white transition-all opacity-0 group-hover/hero:opacity-100"
              aria-label="Previous track"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goNext}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center text-white/80 hover:bg-black/80 hover:text-white transition-all opacity-0 group-hover/hero:opacity-100"
              aria-label="Next track"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dots */}
        {tracks.length > 1 && (
          <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {tracks.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-5 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Featured Album card — below hero on mobile, side on desktop */}
      {featuredAlbum && (
        <div className="px-4 md:px-6 pb-4 md:pb-5 -mt-2 md:-mt-4 relative z-10">
          <Link
            href={`/album/${featuredAlbum.slug || featuredAlbum.id}`}
            className="group inline-flex items-center gap-3 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-sm border border-[var(--border)] rounded-xl transition-all"
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
              {featuredAlbum.coverUrl ? (
                <Image src={featuredAlbum.coverUrl} alt={featuredAlbum.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">Featured Album</p>
              <p className="text-xs font-semibold text-white truncate group-hover:text-[var(--primary)] transition-colors">{featuredAlbum.title}</p>
            </div>
            <ChevronRight size={14} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
          </Link>
        </div>
      )}
    </section>
  );
}
