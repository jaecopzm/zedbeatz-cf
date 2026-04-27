"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Clock, Disc3, Headphones, PlayCircle, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import TrackRow from "@/components/track-row";

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[var(--primary)] rounded-full animate-spin" />
        <p className="text-[var(--muted)] font-medium animate-pulse">Analyzing your listening history...</p>
      </div>
    );
  }

  if (!stats || stats.totalPlays === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <Headphones size={64} className="text-white/10 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">No Stats Yet</h2>
        <p className="text-[var(--muted)] max-w-md">
          Start listening to some music to generate your personalized listening statistics!
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 lg:px-8 max-w-7xl mx-auto pb-32 animate-fade-in">
      <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <BarChart3 className="text-[var(--primary)]" size={28} />
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">Your Listening Stats</h1>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Clock size={80} className="sm:w-[100px] sm:h-[100px]" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-[var(--primary)] mb-1 sm:mb-2 tracking-wider uppercase">Total Listening Time</p>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-1 tabular-nums">
            {formatTime(stats.totalListeningTime)}
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted)]">Spent enjoying your favorite tunes</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <PlayCircle size={80} className="sm:w-[100px] sm:h-[100px]" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-[#1DA1F2] mb-1 sm:mb-2 tracking-wider uppercase">Total Plays</p>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-1 tabular-nums">
            {stats.totalPlays.toLocaleString()}
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted)]">Songs streamed</p>
        </motion.div>
      </div>

      {/* Top Artists */}
      {stats.topArtists && stats.topArtists.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Trophy className="text-[#FFD700]" size={20} />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Your Top Artists</h2>
          </div>

          {/* Artist Play Counts Chart */}
          <div className="bg-[var(--surface-2)] border border-[var(--glass-border)] rounded-xl sm:rounded-2xl p-3 sm:p-6 mb-6 sm:mb-8 h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topArtists} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#111] backdrop-blur-xl border border-white/10 px-3 py-2 rounded-lg shadow-2xl">
                          <p className="text-white font-bold text-xs mb-0.5">{payload[0].payload.name}</p>
                          <p className="text-[var(--primary)] text-xs font-semibold flex items-center gap-1">
                            <PlayCircle size={10} fill="currentColor" className="text-black" />
                            {payload[0].value} plays
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="plays" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {stats.topArtists.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? "var(--primary)" : "var(--primary-glow)"} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {stats.topArtists.map((artist: any, index: number) => (
              <Link 
                key={artist.id} 
                href={`/artist/${artist.slug || artist.id}`}
                className="group bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors p-3 sm:p-4 rounded-lg sm:rounded-xl flex flex-col items-center text-center"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-2 sm:mb-4 rounded-full overflow-hidden shadow-lg group-hover:shadow-[0_0_20px_rgba(30,215,96,0.2)] transition-shadow">
                  {artist.imageUrl ? (
                    <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
                  )}
                  <div className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 bg-[var(--primary)] text-black rounded-br-lg font-black text-[10px] sm:text-xs flex items-center justify-center z-10">
                    {index + 1}
                  </div>
                </div>
                <h3 className="font-bold text-white truncate w-full text-xs sm:text-sm">{artist.name}</h3>
                <p className="text-[10px] sm:text-xs text-[var(--muted)] mt-0.5 sm:mt-1">{artist.plays} plays</p>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Tracks */}
      {stats.topTracks && stats.topTracks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Disc3 className="text-[#FF4500]" size={20} />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Your Top Tracks</h2>
          </div>
          <div className="bg-[var(--surface-2)]/50 rounded-xl sm:rounded-2xl p-1 sm:p-2 border border-[var(--glass-border)]">
            {stats.topTracks.map((track: any, index: number) => (
              <div key={track.id} className="relative group/track flex items-center">
                <div className="w-6 sm:w-8 shrink-0 text-center text-xs sm:text-sm font-bold text-[var(--muted)] group-hover/track:text-white transition-colors">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <TrackRow track={track} queue={stats.topTracks} index={undefined} />
                </div>
                <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                  {track.plays}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
