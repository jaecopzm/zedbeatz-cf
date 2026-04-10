"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Disc3, Play } from "lucide-react";

type Album = {
  id: number;
  title: string;
  releaseYear: number | null;
  coverUrl: string | null;
};

export default function ArtistAlbums({ albums }: { albums: Album[] }) {
  return (
    <section className="px-4 md:px-10 mb-10 md:mb-12">
      <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
          <Disc3 size={15} className="text-purple-400 md:w-[17px] md:h-[17px]" />
        </div>
        <h2 className="text-lg md:text-2xl font-bold tracking-tight">Albums</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {albums.map((album, i) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
          >
            <Link href={`/album/${album.id}`} className="group block">
              <div className={`relative aspect-square rounded-lg md:rounded-xl overflow-hidden mb-2 md:mb-3 bg-[var(--surface-2)] shadow-md`}>
                {album.coverUrl ? (
                  <Image
                    src={album.coverUrl}
                    alt={album.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl font-bold text-[var(--muted)]">
                    {album.title[0]}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <Play size={14} fill="black" className="text-black ml-0.5 md:w-4 md:h-4" />
                  </div>
                </div>
                {album.releaseYear && (
                  <div className="absolute bottom-1.5 left-1.5 md:bottom-2 md:left-2 text-[9px] md:text-[10px] font-bold text-white/80 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 md:px-2">
                    {album.releaseYear}
                  </div>
                )}
              </div>
              <p className="text-xs md:text-sm font-semibold truncate group-hover:text-[var(--primary)] transition-colors">
                {album.title}
              </p>
              <p className="text-[10px] md:text-xs text-[var(--muted)] mt-0.5">Album</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
