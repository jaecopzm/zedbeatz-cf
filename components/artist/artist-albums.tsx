"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, LayoutGrid } from "lucide-react";

type Album = {
  id: number;
  title: string;
  slug: string | null;
  releaseYear: number | null;
  coverUrl: string | null;
};

export default function ArtistAlbums({ albums }: { albums: Album[] }) {
  return (
    <section className="mb-8">
      <div className="px-4 md:px-10 flex items-center gap-2.5 mb-3">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">Albums</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 px-4 md:px-10 scrollbar-hide snap-x snap-mandatory">
        {albums.map((album) => (
          <Link
            key={album.id}
            href={`/album/${album.slug || album.id}`}
            className="group flex-shrink-0 w-[130px] snap-start"
          >
            <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-white/5 mb-2 ring-1 ring-white/5 group-hover:ring-[#1db954]/40 transition-all">
              {album.coverUrl ? (
                <Image src={album.coverUrl} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <LayoutGrid size={28} className="text-white/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {album.releaseYear && (
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/70 text-[10px] font-semibold text-white/80">
                  {album.releaseYear}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-[#1db954] flex items-center justify-center shadow-lg">
                  <Play fill="currentColor" size={14} className="text-black ml-0.5" />
                </div>
              </div>
            </div>
            <p className="text-xs font-bold truncate group-hover:text-[#1db954] transition-colors">{album.title}</p>
            <p className="text-[10px] text-white/40 mt-0.5">Album</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
