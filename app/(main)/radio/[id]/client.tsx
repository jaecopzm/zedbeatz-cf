"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";
import { X, Play, Pause, SkipForward, Radio, Music2 } from "lucide-react";

type SeedTrack = Track & { genre?: string; artist_id: number };

export default function RadioClient({ seedTrack }: { seedTrack: SeedTrack }) {
  const router = useRouter();
  const { queue, currentIndex, playing, toggle, next, setQueue } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [radioStarted, setRadioStarted] = useState(false);
  
  const currentTrack = queue[currentIndex];
  const upcomingTracks = queue.slice(currentIndex + 1, currentIndex + 6);

  useEffect(() => {
    if (radioStarted) return;
    
    const startRadio = async () => {
      try {
        const res = await fetch(`/api/radio?trackId=${seedTrack.id}`);
        const data = await res.json();
        
        if (data.tracks && data.tracks.length > 0) {
          const radioQueue = [seedTrack, ...data.tracks];
          setQueue(radioQueue, 0);
          setRadioStarted(true);
        }
      } catch (error) {
        console.error('Failed to start radio:', error);
      } finally {
        setLoading(false);
      }
    };

    startRadio();
  }, [seedTrack, setQueue, radioStarted]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-lg">Starting {seedTrack.artist} Radio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black to-black" />
        {currentTrack?.coverUrl && (
          <div
            key={currentTrack.id}
            className="absolute inset-0 opacity-20 transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${currentTrack.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(120px)",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 backdrop-blur-xl bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                {seedTrack.artist} Radio
              </h1>
              <p className="text-xs sm:text-sm text-white/50">Personalized for you</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 sm:p-6 overflow-hidden">
          {/* Now Playing */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            {currentTrack ? (
              <div className="text-center w-full max-w-xl">
                {/* Album Art */}
                <div className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 mx-auto mb-6 sm:mb-8 group">
                  <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                    {currentTrack.coverUrl ? (
                      <Image
                        src={currentTrack.coverUrl}
                        alt={currentTrack.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)] flex items-center justify-center">
                        <Music2 className="w-24 h-24 text-white/10" />
                      </div>
                    )}
                  </div>
                  {playing && (
                    <div className="absolute -inset-4 bg-gradient-to-b from-purple-500/30 to-pink-500/20 rounded-3xl blur-3xl -z-10 animate-pulse" />
                  )}
                </div>

                {/* Track Info */}
                <Link href={`/track/${currentTrack.slug || currentTrack.id}`}>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 hover:text-[var(--primary)] transition-colors line-clamp-2">
                    {currentTrack.title}
                  </h2>
                </Link>
                <p className="text-lg sm:text-xl text-white/60 mb-8">{currentTrack.artist}</p>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  <button
                    onClick={toggle}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white hover:bg-[var(--primary)] hover:scale-110 transition-all flex items-center justify-center shadow-2xl"
                  >
                    {playing ? (
                      <Pause className="w-7 h-7 sm:w-8 sm:h-8 text-black" fill="currentColor" />
                    ) : (
                      <Play className="w-7 h-7 sm:w-8 sm:h-8 text-black ml-1" fill="currentColor" />
                    )}
                  </button>
                  <button
                    onClick={next}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all hover:scale-105 flex items-center justify-center"
                  >
                    <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-white/40">
                <Music2 className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <p>No track playing</p>
              </div>
            )}
          </div>

          {/* Upcoming Tracks */}
          {upcomingTracks.length > 0 && (
            <div className="lg:w-96 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 overflow-y-auto custom-scrollbar max-h-[40vh] lg:max-h-none">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>Coming Up</span>
                <span className="text-xs text-white/40 font-normal">({upcomingTracks.length} tracks)</span>
              </h3>
              <div className="space-y-2">
                {upcomingTracks.map((track, idx) => (
                  <Link
                    key={`${track.id}-${idx}`}
                    href={`/track/${track.slug || track.id}`}
                    className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-white/0 hover:bg-white/10 transition-all group"
                  >
                    <span className="text-white/30 text-xs sm:text-sm w-5 text-center shrink-0 font-bold tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="relative w-12 h-12 rounded overflow-hidden shrink-0 ring-1 ring-white/10">
                      {track.coverUrl ? (
                        <Image
                          src={track.coverUrl}
                          alt={track.title}
                          width={48}
                          height={48}
                          className="object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center">
                          <Music2 className="w-5 h-5 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-[var(--primary)] transition-colors">
                        {track.title}
                      </p>
                      <p className="text-white/50 text-xs truncate">{track.artist}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
