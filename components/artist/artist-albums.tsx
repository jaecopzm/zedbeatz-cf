"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, LayoutGrid } from "lucide-react";
import ScrollRow from "@/components/home/scroll-row";

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
      <div className="px-4 md:px-10 mb-3">
        <h2 className="text-xl md:text-[26px] font-black tracking-tight">Albums</h2>
      </div>

      <ScrollRow>
        {albums.map((album) => (
          <Link
            key={album.id}
            href={`/album/${album.slug || album.id}`}
            className="group flex-shrink-0 w-[140px] md:w-[176px] snap-start"
          >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[var(--surface-3)] mb-2 shadow-md ring-1 ring-white/[0.04] group-hover:ring-[var(--primary)]/30 group-hover:shadow-xl transition-all duration-300">
              {album.coverUrl ? (
                <Image src={album.coverUrl} alt={album.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                  <LayoutGrid size={28} />
                </div>
              )}
              {album.releaseYear && (
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-background/70 text-[10px] font-semibold text-foreground/80">
                  {album.releaseYear}
                </div>
              )}
              <div className="absolute inset-0 bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <div className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-xl shadow-[var(--primary-glow)] scale-90 group-hover:scale-100 transition-transform duration-300">
                  <Play fill="currentColor" size={14} className="text-black ml-0.5" />
                </div>
              </div>
            </div>
            <p className="text-xs md:text-sm font-bold truncate group-hover:text-[var(--primary)] transition-colors">{album.title}</p>
            <p className="text-[10px] md:text-xs text-[var(--muted)] mt-0.5">Album</p>
          </Link>
        ))}
      </ScrollRow>
    </section>
  );
}