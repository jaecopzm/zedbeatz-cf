"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePlayer, type Track } from "@/lib/player-store";
import { X, Play, Pause, SkipForward, Radio } from "lucide-react";
import { motion } from "framer-motion";

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
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Starting radio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black" />
        {currentTrack && (
          <motion.div
            key={currentTrack.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${currentTrack.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(100px)",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold text-white">
                {seedTrack.artist} Radio
              </h1>
              <p className="text-sm text-white/60">Personalized for you</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 px-6 pb-6 overflow-hidden">
          {/* Now Playing */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {currentTrack && (
              <motion.div
                key={currentTrack.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 mx-auto mb-8">
                  <Image
                    src={currentTrack.coverUrl || "/placeholder.png"}
                    alt={currentTrack.title}
                    fill
                    className="rounded-2xl shadow-2xl object-cover"
                  />
                  <div className="absolute -inset-4 bg-gradient-to-b from-purple-500/20 to-pink-500/20 rounded-2xl blur-3xl -z-10" />
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {currentTrack.title}
                </h2>
                <p className="text-xl text-white/60 mb-8">{currentTrack.artist}</p>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={toggle}
                    className="w-16 h-16 rounded-full bg-white hover:scale-110 transition-transform flex items-center justify-center"
                  >
                    {playing ? (
                      <Pause className="w-7 h-7 text-black" fill="currentColor" />
                    ) : (
                      <Play className="w-7 h-7 text-black ml-1" fill="currentColor" />
                    )}
                  </button>
                  <button
                    onClick={next}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Upcoming Tracks */}
          <div className="lg:w-96 bg-white/5 backdrop-blur-xl rounded-2xl p-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-lg font-bold text-white mb-4">Coming Up</h3>
            <div className="space-y-3">
              {upcomingTracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="text-white/40 text-sm w-6">{idx + 1}</span>
                  <Image
                    src={track.coverUrl || "/placeholder.png"}
                    alt={track.title}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {track.title}
                    </p>
                    <p className="text-white/60 text-xs truncate">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
