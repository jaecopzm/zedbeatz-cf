"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, TrendingUp, Crown } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

export default function TopCharts({ tracks }: { tracks: Track[] }) {
  const { setQueue } = usePlayer();
  const topTracks = tracks.slice(0, 10);

  return (
    <div className="relative rounded-2xl md:rounded-3xl bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-red-500/5 backdrop-blur-xl border border-white/5 p-4 md:p-8 overflow-hidden shadow-xl">
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 md:w-96 h-64 md:h-96 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 md:w-80 h-48 md:h-80 bg-orange-600/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)] rotate-3">
              <Crown size={20} className="text-black md:w-7 md:h-7" />
            </div>
            <div>
              <h3 className="text-base md:text-2xl font-bold tracking-tight">Top 10 This Week</h3>
              <p className="text-xs md:text-sm text-[var(--muted)]">Most played tracks</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[var(--muted)]">
            <TrendingUp size={12} className="text-orange-500" />
            Updated Hourly
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 md:gap-y-2">
          {topTracks.map((track, i) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              onClick={() => setQueue(topTracks, i)}
              className="group flex items-center gap-3 p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10 active:scale-[0.98]"
            >
              {/* Rank */}
              <div className={`w-6 md:w-8 text-center font-bold text-lg md:text-xl italic tracking-tighter ${
                i === 0 ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] scale-110" : 
                i === 1 ? "text-slate-300" :
                i === 2 ? "text-amber-600" :
                "text-[var(--muted)] opacity-50"
              }`}>
                {i + 1}
              </div>

              {/* Cover */}
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl overflow-hidden shrink-0 shadow-lg group-hover:shadow-[var(--primary)]/10 transition-all duration-500">
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} fill sizes="(max-width: 768px) 40px, 48px" className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                ) : (
                  <div className="w-full h-full bg-[var(--surface-3)] flex items-center justify-center text-lg">♪</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-semibold truncate transition-colors group-hover:text-[var(--primary)]">{track.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] md:text-xs text-[var(--muted)] truncate">
                    {track.artist}
                  </span>
                  {i < 3 && (
                    <TrendingUp size={10} className="text-yellow-500 md:w-3 md:h-3" />
                  )}
                </div>
              </div>

              {/* Play button indicator */}
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 border border-white/10 group-hover:bg-[var(--primary)] flex items-center justify-center transition-all duration-300 shadow-lg group-hover:shadow-[var(--glow-primary)] shrink-0">
                <Play size={12} fill="currentColor" className="text-white group-hover:text-black ml-0.5 transition-colors md:w-3.5 md:h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
