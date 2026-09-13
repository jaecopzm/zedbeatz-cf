"use client";

import Image from "next/image";
import Link from "next/link";
import { usePlayer } from "@/lib/player-store";
import LikeButton from "@/components/like-button";
import AddToPlaylist from "@/components/add-to-playlist";
import { encodeId } from "@/lib/hashids";

export default function NowPlayingPanel() {
  const { queue, currentIndex, context } = usePlayer();
  const track = queue[currentIndex];

  return (
    <aside className="hidden xl:flex w-[300px] 2xl:w-[340px] shrink-0 flex-col min-h-0 rounded overflow-hidden bg-[var(--surface)] ring-1 ring-white/[0.06]">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <p className="text-[13px] font-black tracking-tight truncate">
          {context ? context.label : "Now Playing"}
        </p>
        {track && (
          <div className="flex items-center gap-0.5 shrink-0">
            <LikeButton trackId={track.id} size={16} />
            <AddToPlaylist trackId={track.id} />
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 pb-5">
        {!track ? (
          <div className="rounded-[4px] bg-white/[0.04] ring-1 ring-white/[0.05] p-5 text-center">
            <p className="text-sm font-bold">Nothing playing yet</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Press play and your track shows up here.
            </p>
            <Link
              href="/tracks"
              className="inline-flex items-center mt-4 px-4 h-9 rounded-[4px] bg-[var(--primary)] text-black text-[13px] font-bold hover:scale-105 active:scale-95 transition-all"
            >
              Browse tracks
            </Link>
          </div>
        ) : (
          <>
            <Link
              href={`/track/${encodeId(track.id)}`}
              className="group block rounded-[4px] overflow-hidden bg-white/[0.04] ring-1 ring-white/[0.05] hover:ring-[var(--primary)]/40 transition-all"
            >
              <div className="relative w-full aspect-square bg-[var(--surface-3)]">
                {track.coverUrl && (
                  <Image
                    src={track.coverUrl}
                    alt={track.title}
                    fill
                    sizes="340px"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    unoptimized
                  />
                )}
              </div>
              <div className="p-4">
                <p className="text-[15px] font-black leading-tight truncate group-hover:text-[var(--primary)] transition-colors">
                  {track.title}
                </p>
                <p className="text-xs text-[var(--muted)] truncate mt-1">
                  {track.artist}
                  {track.featuredArtists && <span> ft. {track.featuredArtists}</span>}
                </p>
              </div>
            </Link>

            {context?.href && (
              <Link
                href={context.href}
                className="mt-3 flex items-center justify-between px-4 h-12 rounded-[4px] bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/[0.05] transition-all text-[13px] font-bold"
              >
                <span className="truncate">Playing from {context.label}</span>
                <span className="text-[var(--primary)] shrink-0 ml-2">Open</span>
              </Link>
            )}
          </>
        )}
      </div>
    </aside>
  );
}