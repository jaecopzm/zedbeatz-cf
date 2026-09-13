"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import { useTheme } from "@/components/theme-provider";
import { encodeId } from "@/lib/hashids";

type FeaturedAlbum = {
  id: number; title: string; slug: string | null; releaseYear: number | null;
  artistName: string; artistSlug: string | null; coverUrl: string | null;
};

function useDominantColor(src: string | undefined) {
  const { theme } = useTheme();
  const [color, setColor] = useState("30,215,96");
  useEffect(() => {
    if (!src) return;
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 32, 32);
        const { data } = ctx.getImageData(0, 0, 32, 32);
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          const br = (data[i] + data[i+1] + data[i+2]) / 3;
          if (br < 20 || br > 235) continue;
          r += data[i]; g += data[i+1]; b += data[i+2]; count++;
        }
        if (count > 0) setColor(`${Math.round(r/count)},${Math.round(g/count)},${Math.round(b/count)}`);
      } catch {}
    };
  }, [src]);
  return color;
}

export default function HeroSection({ tracks, featuredAlbum }: { tracks: Track[]; featuredAlbum?: FeaturedAlbum | null }) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const [activeIndex, setActiveIndex] = useState(0);

  const track = tracks[activeIndex] ?? tracks[0];
  const isActive = queue[currentIndex]?.id === track?.id;
  const dominantColor = useDominantColor(track?.coverUrl);

  const goNext = useCallback(() => setActiveIndex(i => (i + 1) % tracks.length), [tracks.length]);
  const goPrev = useCallback(() => setActiveIndex(i => (i - 1 + tracks.length) % tracks.length), [tracks.length]);

  useEffect(() => {
    if (tracks.length <= 1) return;
    const t = setInterval(goNext, 6000);
    return () => clearInterval(t);
  }, [goNext, tracks.length]);

  if (!track) return null;

  function handlePlay() {
    if (isActive) toggle();
    else setQueue(tracks, activeIndex, { label: "Featured", href: "/" });
  }

  const scrimGradient = useMemo(() => {
    return `linear-gradient(to top, rgba(${dominantColor},0.95) 0%, rgba(${dominantColor},0.3) 50%, transparent 100%)`;
  }, [dominantColor]);

  return (
    <section className="group/hero relative mx-2 md:mx-4 mb-6 md:mb-8 rounded-2xl overflow-hidden bg-[var(--surface-2)]">
      {/* Full-bleed cover art */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[2/1] md:aspect-[21/9]">
        {track.coverUrl && (
          <Image
            key={track.id}
            src={track.coverUrl}
            alt={track.title}
            fill
            className="object-cover transition-opacity duration-700"
            priority
            sizes="100vw"
          />
        )}

        {/* Dynamic gradient scrim using extracted color */}
        <div className="absolute inset-0" style={{ background: scrimGradient }} />

        {/* Nav arrows */}
        {tracks.length > 1 && (
          <>
            <button onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover/hero:opacity-100">
              <ChevronLeft size={18} />
            </button>
            <button onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover/hero:opacity-100">
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Bottom content overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 md:px-8 pb-4 md:pb-7 flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-white/50 mb-1">Featured Track</p>
            <h2 className="text-lg md:text-4xl font-black text-white leading-tight line-clamp-1 drop-shadow-sm">
              {track.title}
            </h2>
            <p className="text-xs md:text-base text-white/70 mt-0.5 truncate">
              <span className="font-semibold text-white/90">{track.artist}</span>
              {track.featuredArtists && <span className="text-white/50"> feat. {track.featuredArtists}</span>}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-black rounded-full font-bold text-xs md:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
              style={{ background: `rgb(${dominantColor})` }}
            >
              {isActive && playing
                ? <><Pause size={14} fill="currentColor" /><span className="hidden sm:inline">Pause</span></>
                : <><Play size={14} fill="currentColor" className="ml-0.5" /><span className="hidden sm:inline">Play</span></>
              }
            </button>
            <Link
              href={`/track/${encodeId(track.id)}`}
              className="hidden sm:flex items-center px-4 md:px-5 py-2 md:py-3 rounded-full border border-white/30 text-white text-xs md:text-sm font-semibold hover:bg-white/10 transition-all"
              onClick={e => e.stopPropagation()}
            >
              View
            </Link>
          </div>
        </div>

        {/* Dots */}
        {tracks.length > 1 && (
          <div className="absolute bottom-4 md:bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
            {tracks.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`rounded-full transition-all duration-300 pointer-events-auto ${i === activeIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Featured Album strip */}
      {featuredAlbum && (
        <Link
          href={`/album/${encodeId(featuredAlbum.id)}`}
          className="group flex items-center gap-3 px-4 py-3 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border-t border-[var(--border)] transition-colors"
        >
          <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
            {featuredAlbum.coverUrl && <Image src={featuredAlbum.coverUrl} alt={featuredAlbum.title} fill className="object-cover" unoptimized />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `rgb(${dominantColor})` }}>Featured Album</p>
            <p className="text-xs font-semibold truncate group-hover:text-[var(--primary)] transition-colors">{featuredAlbum.title}</p>
          </div>
          <ChevronRight size={14} className="text-[var(--muted-2)] shrink-0" />
        </Link>
      )}
    </section>
  );
}