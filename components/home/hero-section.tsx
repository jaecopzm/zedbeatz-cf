"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Pause, Disc3 } from "lucide-react";
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

export default function HeroSection({ tracks, featuredAlbum }: { tracks: Track[]; featuredAlbum?: FeaturedAlbum | null }) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const track = tracks[0];
  const isActive = queue[currentIndex]?.id === track?.id;

  if (!track) {
    return (
      <section className="relative overflow-hidden mb-6 md:mb-10 rounded-2xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/5 p-8 md:p-12" style={{ minHeight: "320px" }}>
        <div className="flex flex-col items-center justify-center text-center h-full">
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
    else setQueue(tracks, 0, { label: "Featured", href: "/" });
  }

  return (
    <section className="relative overflow-hidden mb-6 md:mb-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 md:p-8">
        {/* Album Art */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 shrink-0 rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
          {track.coverUrl ? (
            <Image src={track.coverUrl} alt={track.title} fill sizes="(max-width: 768px) 192px, 256px" className="object-cover" priority />
          ) : (
            <div className="w-full h-full bg-white/5" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Featured Track</p>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-2 leading-tight truncate">{track.title}</h1>
          <p className="text-sm md:text-base text-white/80 mb-4">
            <Link href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`} className="hover:underline font-semibold">
              {track.artist}
            </Link>
            {track.featuredArtists && <span className="text-white/60"> feat. {track.featuredArtists}</span>}
          </p>

          <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
            <button
              onClick={handlePlay}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-transform shadow-xl"
            >
              {isActive && playing ? <><Pause size={18} fill="currentColor" />Pause</> : <><Play size={18} fill="currentColor" className="ml-0.5" />Play Now</>}
            </button>
            <Link
              href={track.slug ? `/track/${track.slug}` : `/track/${track.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold text-sm transition-all"
            >
              Details
            </Link>
          </div>
        </div>

        {/* Featured Album card */}
        {featuredAlbum && (
          <Link
            href={`/album/${featuredAlbum.slug || featuredAlbum.id}`}
            className="group shrink-0 flex flex-row md:flex-col items-center gap-3 md:gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl p-3 transition-all w-full md:w-40"
          >
            <div className="relative w-14 h-14 md:w-full md:aspect-square rounded-lg overflow-hidden shrink-0">
              {featuredAlbum.coverUrl ? (
                <Image src={featuredAlbum.coverUrl} alt={featuredAlbum.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <Disc3 size={20} className="text-white/40" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Featured Album</p>
              <p className="text-sm font-bold text-white truncate">{featuredAlbum.title}</p>
              <p className="text-xs text-white/60 truncate">{featuredAlbum.artistName}</p>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
