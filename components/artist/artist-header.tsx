"use client";

import Image from "next/image";
import { Play, Pause, Shuffle, BadgeCheck } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import FollowButton from "@/components/follow-button";
import { encodeId } from "@/lib/hashids";

type Artist = {
  id: number;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  slug: string | null;
  trackCount: number;
  albumCount: number;
  totalPlays: number;
};

export default function ArtistHeader({ artist, tracks }: { artist: Artist; tracks: Track[] }) {
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const isPlaying = queue.length > 0 && queue[0]?.artistId === artist.id && playing;

  function handlePlay() {
    if (isPlaying) toggle();
    else setQueue(tracks, 0, { label: artist.name, href: `/artist/${encodeId(artist.id)}` });
  }

  function handleShuffle() {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0, { label: artist.name, href: `/artist/${encodeId(artist.id)}` });
  }

  return (
    <section className="relative mb-2 overflow-hidden">
      {/* Ambient background with gradient overlay */}
      <div className="absolute inset-0 -z-10">
        {artist.imageUrl && (
          <>
            <Image
              src={artist.imageUrl}
              alt={artist.name}
              fill
              sizes="100vw"
              className="object-cover opacity-40 blur-[120px] scale-125"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-background" />
          </>
        )}
        {!artist.imageUrl && <div className="absolute inset-0 bg-background" />}
      </div>

      {/* Content */}
      <div className="px-4 md:px-10 pt-12 pb-6 md:pt-20 md:pb-8">
        <div className="flex flex-col md:flex-row gap-5 md:items-end">
          {/* Avatar */}
          <div className="relative w-[160px] h-[160px] md:w-[232px] md:h-[232px] shrink-0 rounded-full overflow-hidden shadow-2xl ring-2 ring-[var(--border)] mx-auto md:mx-0">
            {artist.imageUrl ? (
              <Image src={artist.imageUrl} alt={artist.name} fill sizes="232px" className="object-cover" priority unoptimized />
            ) : (
              <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center text-6xl font-black text-foreground/30">
                {artist.name[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            {/* Label */}
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              Artist
            </p>

            {/* Name with verified badge */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-2 truncate flex items-center gap-3 justify-center md:justify-start">
              {artist.name}
              <span className="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#3b82f6] text-white shrink-0">
                <BadgeCheck size={16} className="md:w-5 md:h-5" />
              </span>
            </h1>

            {artist.bio && (
              <p className="text-xs md:text-sm text-[var(--muted)] mb-3 line-clamp-1 max-w-xl mx-auto md:mx-0">{artist.bio}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs text-[var(--muted)] justify-center md:justify-start">
              <span className="font-semibold text-foreground/80">
                {(artist.totalPlays || artist.trackCount * 5000).toLocaleString()} monthly listeners
              </span>
              <span className="text-[var(--muted-2)]">·</span>
              <span>{artist.trackCount} tracks</span>
              {artist.albumCount > 0 && (
                <>
                  <span className="text-[var(--muted-2)]">·</span>
                  <span>{artist.albumCount} albums</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 flex-wrap mt-6 justify-center md:justify-start">
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-[var(--primary)] text-black hover:scale-105 active:scale-100 transition-all shadow-lg shadow-[var(--primary-glow)]"
          >
            {isPlaying ? (
              <><Pause size={16} fill="currentColor" /> Pause</>
            ) : (
              <><Play size={16} fill="currentColor" className="ml-0.5" /> Play</>
            )}
          </button>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-transparent hover:bg-[var(--glass-hover)] border border-[var(--border)] text-foreground font-bold text-sm transition-all hover:scale-105 active:scale-100"
          >
            <Shuffle size={16} /> Shuffle
          </button>
          <FollowButton artistId={artist.id} />
        </div>
      </div>
    </section>
  );
}