"use client";

import Image from "next/image";
import { Play, Pause, Shuffle, Headphones } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import FollowButton from "@/components/follow-button";

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
    else setQueue(tracks, 0, { label: artist.name, href: `/artist/${artist.slug || artist.id}` });
  }

  function handleShuffle() {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0, { label: artist.name, href: `/artist/${artist.slug || artist.id}` });
  }

  return (
    <section className="relative mb-6 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        {artist.imageUrl && (
          <>
            <Image
              src={artist.imageUrl}
              alt={artist.name}
              fill
              sizes="100vw"
              className="object-cover opacity-30 blur-[100px] scale-125"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
          </>
        )}
        {!artist.imageUrl && <div className="absolute inset-0 bg-[#0a0a0a]" />}
      </div>

      {/* Content */}
      <div className="px-4 md:px-10 pt-5 pb-4">
        <div className="flex gap-4 items-center mb-4">
          {/* Avatar */}
          <div className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden shadow-2xl ring-2 ring-white/10">
            {artist.imageUrl ? (
              <Image src={artist.imageUrl} alt={artist.name} fill sizes="96px" className="object-cover" priority unoptimized />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-3xl font-black text-white/30">
                {artist.name[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1 truncate">{artist.name}</h1>
            {artist.bio && (
              <p className="text-xs md:text-sm text-white/60 mb-2 line-clamp-1">{artist.bio}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>{artist.trackCount} tracks</span>
              {artist.albumCount > 0 && <span>{artist.albumCount} albums</span>}
              {artist.totalPlays > 0 && <span className="flex items-center gap-1 text-[#1db954]"><Headphones size={11} />{artist.totalPlays.toLocaleString()}</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold text-xs text-black transition-all hover:scale-105 active:scale-100"
            style={{ background: "linear-gradient(135deg, #1db954, #17a348)" }}
          >
            {isPlaying ? (
              <><Pause size={13} fill="currentColor" /> Pause</>
            ) : (
              <><Play size={13} fill="currentColor" className="ml-0.5" /> Play All</>
            )}
          </button>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/8 hover:bg-white/12 border border-white/10 text-white font-semibold text-xs transition-all hover:scale-105 active:scale-100"
          >
            <Shuffle size={13} /> Shuffle
          </button>
          <FollowButton artistId={artist.id} />
        </div>
      </div>
    </section>
  );
}
