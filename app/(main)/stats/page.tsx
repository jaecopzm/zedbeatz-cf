"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Clock, Disc3, Headphones, PlayCircle, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import TrackRow from "@/components/track-row";
import { ChartContainer } from "@/components/ui/chart";
import type { Track } from "@/lib/player-store";

type StatsTrack = Track & {
  plays: number;
};

type PlayedTrackDuration = {
  id: number;
  audioUrl: string;
  duration?: number;
  plays: number;
};

type TopArtist = {
  id: number;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  plays: number;
};

type StatsResponse = {
  totalListeningTime: number;
  totalPlays: number;
  topTracks: StatsTrack[];
  topArtists: TopArtist[];
  playedTracks: PlayedTrackDuration[];
};

function normalizeStatsResponse(data: Partial<StatsResponse> | null | undefined): StatsResponse | null {
  if (!data || typeof data.totalPlays !== "number" || typeof data.totalListeningTime !== "number") {
    return null;
  }

  return {
    totalListeningTime: data.totalListeningTime,
    totalPlays: data.totalPlays,
    topTracks: Array.isArray(data.topTracks) ? data.topTracks : [],
    topArtists: Array.isArray(data.topArtists) ? data.topArtists : [],
    playedTracks: Array.isArray(data.playedTracks) ? data.playedTracks : [],
  };
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function formatCompactDuration(seconds: number) {
  const totalMinutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${totalMinutes}:${String(secs).padStart(2, "0")}`;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [resolvedListeningTime, setResolvedListeningTime] = useState<{ key: string; value: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(normalizeStatsResponse(data));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load stats:", err);
        setLoading(false);
      });
  }, []);

  const playedTracksKey = useMemo(
    () =>
      (stats?.playedTracks ?? [])
        .map((track) => `${track.id}:${track.plays}:${track.duration ?? "missing"}`)
        .join("|"),
    [stats]
  );

  useEffect(() => {
    if (!stats || stats.playedTracks.length === 0) {
      return;
    }

    const knownListeningTime = stats.playedTracks.reduce(
      (sum, track) => sum + (track.duration ?? 0) * track.plays,
      0
    );
    const missingTracks = stats.playedTracks.filter((track) => !track.duration && track.audioUrl);

    if (missingTracks.length === 0) {
      return;
    }

    let cancelled = false;

    const readAudioDuration = (audioUrl: string) =>
      new Promise<number>((resolve) => {
        const audio = document.createElement("audio");
        const cleanup = () => {
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
          audio.removeEventListener("error", handleError);
          audio.src = "";
        };
        const handleLoadedMetadata = () => {
          const nextDuration = Number.isFinite(audio.duration) ? Math.floor(audio.duration) : 0;
          cleanup();
          resolve(nextDuration);
        };
        const handleError = () => {
          cleanup();
          resolve(0);
        };

        audio.preload = "metadata";
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("error", handleError);
        audio.src = audioUrl;
      });

    Promise.all(
      missingTracks.map(async (track) => ({
        plays: track.plays,
        duration: await readAudioDuration(track.audioUrl),
      }))
    ).then((resolvedTracks) => {
      if (cancelled) return;

      const resolvedMissingTime = resolvedTracks.reduce(
        (sum, track) => sum + track.duration * track.plays,
        0
      );

      setResolvedListeningTime({
        key: playedTracksKey,
        value: knownListeningTime + resolvedMissingTime,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [playedTracksKey, stats]);

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

  const knownListeningTime = stats.playedTracks.reduce(
    (sum, track) => sum + (track.duration ?? 0) * track.plays,
    0
  );
  const displayListeningTime =
    resolvedListeningTime?.key === playedTracksKey
      ? resolvedListeningTime.value
      : knownListeningTime || stats.totalListeningTime;
  const uniqueArtistCount = stats.topArtists.length;
  const averageTrackLength = stats.totalPlays > 0 ? Math.round(displayListeningTime / stats.totalPlays) : 0;

  return (
    <div className="w-full px-4 py-5 lg:px-6 xl:px-8 pb-24 animate-fade-in">
      <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
        <BarChart3 className="text-[var(--primary)]" size={28} />
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">Your Listening Stats</h1>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5 sm:mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] p-4 rounded-xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group min-h-[132px]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Clock size={56} />
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-[var(--primary)] mb-1 tracking-wider uppercase">Listening Time</p>
          <div className="text-2xl sm:text-3xl xl:text-4xl font-black text-white mb-1 tabular-nums">
            {formatTime(displayListeningTime)}
          </div>
          <p className="text-[11px] sm:text-xs text-[var(--muted)]">Across your full play history</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] p-4 rounded-xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group min-h-[132px]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <PlayCircle size={56} />
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-[#1DA1F2] mb-1 tracking-wider uppercase">Total Plays</p>
          <div className="text-2xl sm:text-3xl xl:text-4xl font-black text-white mb-1 tabular-nums">
            {stats.totalPlays.toLocaleString()}
          </div>
          <p className="text-[11px] sm:text-xs text-[var(--muted)]">Every recorded stream event</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] p-4 rounded-xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group min-h-[132px]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Trophy size={56} />
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-[#FFD700] mb-1 tracking-wider uppercase">Top Artists</p>
          <div className="text-2xl sm:text-3xl xl:text-4xl font-black text-white mb-1 tabular-nums">
            {uniqueArtistCount}
          </div>
          <p className="text-[11px] sm:text-xs text-[var(--muted)]">Artists appearing in your leaderboard</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] p-4 rounded-xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group min-h-[132px]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Disc3 size={56} />
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-[#FF4500] mb-1 tracking-wider uppercase">Avg Track Length</p>
          <div className="text-2xl sm:text-3xl xl:text-4xl font-black text-white mb-1 tabular-nums">
            {formatCompactDuration(averageTrackLength)}
          </div>
          <p className="text-[11px] sm:text-xs text-[var(--muted)]">Derived from your played tracks</p>
        </motion.div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)] xl:items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Disc3 className="text-[#FF4500]" size={20} />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Your Top Tracks</h2>
          </div>
          <div className="bg-[var(--surface-2)]/60 rounded-xl p-2 border border-[var(--glass-border)]">
            {stats.topTracks.map((track: StatsTrack, index: number) => (
              <div key={track.id} className="relative group/track flex items-center">
                <div className="w-7 shrink-0 text-center text-xs font-bold text-[var(--muted)] group-hover/track:text-white transition-colors">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <TrackRow track={track} queue={stats.topTracks} index={undefined} className="pr-20 sm:pr-24" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded">
                  {track.plays}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Trophy className="text-[#FFD700]" size={20} />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Your Top Artists</h2>
          </div>

          <ChartContainer
            className="bg-[var(--surface-2)] border border-[var(--glass-border)] rounded-xl p-3 sm:p-4 mb-4 h-[200px] w-full min-w-0 sm:h-[240px]"
            config={{
              plays: {
                label: "Plays",
                color: "var(--primary)",
              },
            }}
            initialDimension={{ width: 640, height: 280 }}
          >
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
                  {stats.topArtists.map((entry: TopArtist, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? "var(--primary)" : "var(--primary-glow)"} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-2 gap-3">
            {stats.topArtists.map((artist: TopArtist, index: number) => (
              <Link 
                key={artist.id} 
                href={`/artist/${artist.slug || artist.id}`}
                className="group bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors p-3 rounded-xl flex items-center gap-3 text-left min-w-0"
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg group-hover:shadow-[0_0_20px_rgba(30,215,96,0.2)] transition-shadow shrink-0">
                  {artist.imageUrl ? (
                    <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
                  )}
                  <div className="absolute top-0 left-0 w-5 h-5 bg-[var(--primary)] text-black rounded-br-lg font-black text-[10px] flex items-center justify-center z-10">
                    {index + 1}
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white truncate text-sm">{artist.name}</h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{artist.plays} plays</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
