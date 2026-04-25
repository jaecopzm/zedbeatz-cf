"use client";

import { motion } from "framer-motion";
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
    <section className="mb-10 md:mb-14">
      {/* Section header */}
      <div className="px-4 md:px-10 flex items-center gap-3 mb-5 md:mb-7">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-400 to-yellow-300 shrink-0" />
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Albums</h2>
      </div>

      <div className="relative">
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 px-4 md:px-10 scrollbar-hide snap-x snap-mandatory">
          {albums.map((album, i) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex-shrink-0 w-[140px] md:w-[176px] snap-start"
            >
              <Link href={`/album/${album.slug || album.id}`} className="group block">
                {/* Cover */}
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[var(--surface-3)] mb-2.5 shadow-lg ring-1 ring-white/5 group-hover:ring-[var(--primary)]/40 group-hover:shadow-[0_8px_30px_rgba(30,215,96,0.15)] transition-all duration-400">
                  {album.coverUrl ? (
                    <Image
                      src={album.coverUrl}
                      alt={album.title}
                      fill
                      className="object-cover transition-transform duration-600 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center">
                      <LayoutGrid size={32} className="text-[var(--muted)]/40" />
                    </div>
                  )}
                  {/* Gradient bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Year badge */}
                  {album.releaseYear && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-white/80">
                      {album.releaseYear}
                    </div>
                  )}
                  {/* Play hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-[var(--primary)] flex items-center justify-center translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-350 shadow-[var(--glow-primary)]">
                      <Play fill="currentColor" size={16} className="text-black ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Text */}
                <p className="text-xs md:text-sm font-bold truncate leading-tight group-hover:text-[var(--primary)] transition-colors">
                  {album.title}
                </p>
                <p className="text-[10px] md:text-xs text-[var(--muted)] truncate mt-0.5">
                  Album
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
        
        {/* Fade edges */}
        <div className="absolute top-0 left-0 bottom-4 w-4 md:w-10 bg-gradient-to-r from-[var(--background)] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-4 w-12 md:w-16 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
