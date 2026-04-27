"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";
import { Play, Pause, Music2, ChevronLeft, Headphones, Clock, Calendar, Radio, Sparkles, TrendingUp, Users, BarChart3, Disc3 } from "lucide-react";
import LikeButton from "@/components/like-button";
import AddToPlaylist from "@/components/add-to-playlist";
import ShareButton from "@/components/share-button";
import DownloadButton from "@/components/download-button";
import WhatsAppBanner from "@/components/whatsapp-banner";
import TrackComments from "@/components/track-comments";
import { motion, useScroll, useTransform } from "framer-motion";

type TrackWithMeta = Track & { genre: string | null; plays: number | null; lyrics?: string | null; releaseYear?: number };

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function TrackPageClient({ track }: { track: TrackWithMeta }) {
  const { play, toggle, queue, currentIndex, playing, setQueue } = usePlayer();
  const currentTrack = queue[currentIndex];
  const isActive = currentTrack?.id === track.id;
  const [plays, setPlays] = useState<number | null>(track.plays);
  const [activeTab, setActiveTab] = useState<"about" | "lyrics" | "credits">("about");
  const [actualDuration, setActualDuration] = useState<number | undefined>(track.duration);
  const [loadingRadio, setLoadingRadio] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    if (!isActive && queue.length === 0) {
      usePlayer.setState({ queue: [track], currentIndex: 0, playing: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get actual duration from audio element
  useEffect(() => {
    const audio = document.querySelector('audio');
    if (isActive && audio) {
      const updateDuration = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setActualDuration(Math.floor(audio.duration));
        }
      };
      audio.addEventListener('loadedmetadata', updateDuration);
      if (audio.duration) updateDuration();
      return () => audio.removeEventListener('loadedmetadata', updateDuration);
    }
  }, [isActive]);

  // Refresh play count when this track becomes active (just played)
  useEffect(() => {
    if (!isActive) return;
    fetch(`/api/tracks/${track.id}`)
      .then(r => r.json())
      .then(data => { if (data?.plays != null) setPlays(data.plays); })
      .catch(() => {});
  }, [isActive, track.id]);

  // Start Artist Radio
  const startRadio = async () => {
    setLoadingRadio(true);
    try {
      const res = await fetch(`/api/radio?trackId=${track.id}`);
      const data = await res.json();
      
      if (data.tracks && data.tracks.length > 0) {
        // Start with current track, then add radio tracks
        const radioQueue = [track, ...data.tracks];
        setQueue(radioQueue, 0);
        if (!playing) toggle();
      }
    } catch (error) {
      console.error('Failed to start radio:', error);
    } finally {
      setLoadingRadio(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-b from-[var(--background)] via-[var(--background)] to-black/40">
      {/* ── Premium Hero with Parallax ─────────────────────── */}
      <motion.section 
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative px-3 sm:px-4 md:px-8 pt-4 sm:pt-6 md:pt-10 pb-6 sm:pb-8 md:pb-16 max-w-7xl mx-auto overflow-hidden"
      >
        {/* Dynamic ambient glow */}
        {track.coverUrl && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] opacity-20 sm:opacity-30 blur-[120px] sm:blur-[150px] pointer-events-none animate-pulse">
            <div className="w-full h-full bg-gradient-radial from-[var(--primary)] via-purple-500/40 to-pink-500/20" />
          </div>
        )}

        {/* Back Link */}
        <Link
          href="/"
          className="relative inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-white/50 hover:text-white transition-colors mb-5 sm:mb-8 md:mb-10 group"
        >
          <ChevronLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </Link>

        <div className="relative flex flex-col lg:flex-row items-center lg:items-start gap-5 sm:gap-6 md:gap-8 lg:gap-12">
          {/* Enhanced Artwork */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative shrink-0 group"
          >
            {isActive && playing && (
              <div className="absolute -inset-3 sm:-inset-4 lg:-inset-6 rounded-3xl bg-gradient-to-br from-[var(--primary)]/30 via-purple-500/20 to-pink-500/10 blur-xl sm:blur-2xl lg:blur-3xl animate-pulse pointer-events-none" />
            )}
            <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10 backdrop-blur-sm">
              {track.coverUrl ? (
                <Image src={track.coverUrl} alt={track.title} fill sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, 384px" className="object-cover transition-transform duration-700 group-hover:scale-110" priority unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center">
                  <Music2 size={96} className="text-white/10" />
                </div>
              )}
              {/* Premium visualizer overlay */}
              {isActive && playing && (
                <div className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                  <div className="flex items-end gap-1">
                    {[...Array(16)].map((_, i) => (
                      <motion.span
                        key={i}
                        className="w-1 rounded-full bg-gradient-to-t from-[var(--primary)] to-white shadow-[0_0_12px_rgba(30,215,96,0.8)]"
                        animate={{
                          height: [
                            `${12 + Math.random() * 20}px`,
                            `${20 + Math.random() * 30}px`,
                            `${12 + Math.random() * 20}px`,
                          ],
                        }}
                        transition={{
                          duration: 0.5 + Math.random() * 0.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          </motion.div>

          {/* Enhanced Info */}
          <div className="flex-1 w-full text-center lg:text-left lg:flex lg:flex-col lg:justify-between lg:min-h-[384px]">
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              {/* Stats Row */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2"
              >
                <span className="px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 shadow-sm">
                  {track.genre || "Music"}
                </span>
                {plays != null && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[10px] font-bold text-[var(--primary)] backdrop-blur-sm">
                    <Headphones size={11} />
                    {plays.toLocaleString()} plays
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 backdrop-blur-sm">
                  <TrendingUp size={11} />
                  Trending
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-[1.05] mb-2 sm:mb-3 lg:mb-4 bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] px-2 lg:px-0">
                  {track.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg px-2 lg:px-0 mb-3 sm:mb-4">
                  <Link
                    href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`}
                    className="font-bold text-white/90 hover:text-[var(--primary)] transition-colors underline decoration-white/20 hover:decoration-[var(--primary)] underline-offset-4"
                  >
                    {track.artist}
                  </Link>
                  {track.featuredArtists && (
                    <span className="text-white/50 font-medium text-sm sm:text-base">feat. {track.featuredArtists}</span>
                  )}
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-white/50">
                  {actualDuration && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} />
                      <span className="font-semibold tabular-nums">{fmt(actualDuration)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span className="font-semibold">{track.releaseYear || new Date().getFullYear()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Disc3 size={13} />
                    <span className="font-semibold">Single</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Premium Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mt-4 sm:mt-5 lg:mt-6"
            >
              <button
                onClick={() => isActive ? toggle() : play(track)}
                className="flex items-center gap-2 sm:gap-2.5 px-8 sm:px-10 py-3 sm:py-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-black text-xs sm:text-sm uppercase tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(30,215,96,0.4)] hover:shadow-[0_12px_40px_rgba(30,215,96,0.5)]"
              >
                {isActive && playing
                  ? <><Pause size={16} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" /> Pause</>
                  : <><Play size={16} className="sm:w-[18px] sm:h-[18px] ml-0.5" fill="currentColor" /> Play</>
                }
              </button>

              <button 
                onClick={startRadio}
                disabled={loadingRadio}
                className="flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-3 sm:py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {loadingRadio ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Radio size={14} className="sm:w-4 sm:h-4" />
                )}
                <span className="hidden sm:inline">{loadingRadio ? 'Loading...' : 'Radio'}</span>
              </button>

              <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-full shadow-lg">
                <LikeButton trackId={track.id} size={16} />
                <AddToPlaylist trackId={track.id} />
                <DownloadButton audioUrl={track.audioUrl} title={track.title} artist={track.artist} coverUrl={track.coverUrl} />
                <ShareButton title={`${track.title} by ${track.artist}`} />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── Premium Tabs Section ──────────────────────────── */}
      <section className="px-3 sm:px-4 md:px-8 max-w-7xl mx-auto mb-8 sm:mb-12">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 p-1.5 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl w-fit mx-auto lg:mx-0">
          {(["about", "lyrics", "credits"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${
                activeTab === tab
                  ? "bg-[var(--primary)] text-black shadow-lg"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl"
        >
          {activeTab === "about" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                  <BarChart3 size={20} className="text-[var(--primary)]" />
                  Track Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-2xl font-black text-white mb-1">{plays?.toLocaleString() || "0"}</div>
                    <div className="text-xs text-white/50 font-semibold">Total Plays</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-2xl font-black text-white mb-1">{actualDuration ? fmt(actualDuration) : "—"}</div>
                    <div className="text-xs text-white/50 font-semibold">Duration</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-white mb-3">About This Track</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {track.title} is a {track.genre?.toLowerCase() || "music"} track by {track.artist}
                  {track.featuredArtists && ` featuring ${track.featuredArtists}`}. 
                  This song showcases their unique style and has been gaining popularity among listeners worldwide.
                </p>
              </div>
            </div>
          )}

          {activeTab === "lyrics" && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-white mb-4">Lyrics</h3>
              {track.lyrics ? (
                <div className="text-sm text-white/80 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {track.lyrics}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music2 size={48} className="mx-auto mb-4 text-white/10" />
                  <p className="text-sm text-white/50">Lyrics not available for this track</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "credits" && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white mb-4">Credits</h3>
              <div className="grid gap-4">
                <div className="flex items-start justify-between py-3 border-b border-white/10">
                  <span className="text-sm text-white/50 font-semibold">Artist</span>
                  <span className="text-sm text-white font-bold">{track.artist}</span>
                </div>
                {track.featuredArtists && (
                  <div className="flex items-start justify-between py-3 border-b border-white/10">
                    <span className="text-sm text-white/50 font-semibold">Featured Artists</span>
                    <span className="text-sm text-white font-bold">{track.featuredArtists}</span>
                  </div>
                )}
                <div className="flex items-start justify-between py-3 border-b border-white/10">
                  <span className="text-sm text-white/50 font-semibold">Genre</span>
                  <span className="text-sm text-white font-bold">{track.genre || "Unknown"}</span>
                </div>
                <div className="flex items-start justify-between py-3 border-b border-white/10">
                  <span className="text-sm text-white/50 font-semibold">Duration</span>
                  <span className="text-sm text-white font-bold">{actualDuration ? fmt(actualDuration) : "Unknown"}</span>
                </div>
                <div className="flex items-start justify-between py-3">
                  <span className="text-sm text-white/50 font-semibold">Release Year</span>
                  <span className="text-sm text-white font-bold">{track.releaseYear || new Date().getFullYear()}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* ── WhatsApp Banner ──────────────────────────────── */}
      <div className="px-3 sm:px-4 md:px-8 max-w-7xl mx-auto mb-8 sm:mb-10 md:mb-12">
        <WhatsAppBanner />
      </div>

      {/* ── More From Artist (Premium) ─────────────────────── */}
      {(track as any).moreFromArtist?.length === 0 && (
        <section className="px-3 sm:px-4 md:px-8 max-w-7xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-6">More from {track.artist}</h2>
          <div className="flex flex-col items-center justify-center py-16 rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-sm text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Music2 size={32} className="text-white/20" />
            </div>
            <p className="text-sm font-semibold text-white/50">No other songs from {track.artist} yet</p>
            <Link href={`/artist/${track.artistSlug || track.artistId}`} className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors uppercase tracking-wide">
              View artist profile
            </Link>
          </div>
        </section>
      )}
      {(track as any).moreFromArtist?.length > 0 && (
        <section className="px-3 sm:px-4 md:px-8 max-w-7xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white">More from {track.artist}</h2>
            <Link href={`/artist/${track.artistSlug || track.artistId}`} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors uppercase tracking-wide">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(track as any).moreFromArtist.map((t: any, idx: number) => {
              const isThisActive = currentTrack?.id === t.id;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    href={`/track/${t.slug || t.id}`}
                    className="group flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[var(--surface-2)] shrink-0 shadow-lg">
                      {t.coverUrl
                        ? <Image src={t.coverUrl} alt={t.title} width={56} height={56} className="object-cover transition-transform duration-300 group-hover:scale-110" />
                        : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">♪</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate transition-colors ${isThisActive ? "text-[var(--primary)]" : "group-hover:text-white"}`}>{t.title}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{t.artist}</p>
                    </div>
                    {t.duration && <span className="text-[10px] text-white/30 tabular-nums shrink-0 font-semibold">{fmt(t.duration)}</span>}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        isThisActive ? toggle() : play(t);
                      }}
                      className="shrink-0 w-9 h-9 rounded-full bg-white/5 hover:bg-[var(--primary)] hover:text-black flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md"
                    >
                      {isThisActive && playing
                        ? <Pause size={14} fill="currentColor" />
                        : <Play size={14} fill="currentColor" className="ml-0.5" />
                      }
                    </button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Up Next (Premium) ──────────────────────────────── */}
      {queue.length > 1 && (
        <section className="px-3 sm:px-4 md:px-8 max-w-7xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-xl sm:text-2xl font-black mb-4 flex items-center gap-2">
            <span>Up Next</span>
            <span className="text-sm font-bold text-white/40">({queue.length - currentIndex - 1} tracks)</span>
          </h2>
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-md border border-white/10 shadow-2xl divide-y divide-white/5">
            {queue.slice(currentIndex + 1, currentIndex + 6).map((t, i) => (
              <motion.div
                key={`${t.id}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                <span className="text-xs font-black text-white/30 w-4 text-center shrink-0 tabular-nums">{i + 1}</span>
                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0 shadow-lg">
                  {t.coverUrl && (
                    <Image src={t.coverUrl} alt={t.title} width={44} height={44} className="object-cover transition-transform duration-300 group-hover:scale-110" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate group-hover:text-[var(--primary)] transition-colors">{t.title}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{t.artist}</p>
                </div>
                {t.duration && (
                  <span className="text-xs text-[var(--muted)] tabular-nums shrink-0 font-semibold">{fmt(t.duration)}</span>
                )}
              </motion.div>
            ))}
            {queue.length - currentIndex - 1 > 5 && (
              <div className="px-4 py-3 text-center bg-white/[0.02]">
                <span className="text-xs font-bold text-white/30 uppercase tracking-wider">
                  +{queue.length - currentIndex - 6} more tracks
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Comments ───────────────────────────────────────── */}
      <section className="px-3 sm:px-4 md:px-8 max-w-7xl mx-auto mb-8 sm:mb-10 md:mb-12">
        <TrackComments trackId={track.id} />
      </section>
    </div>
  );
}
