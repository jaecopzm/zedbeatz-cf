"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlayer, type Track } from "@/lib/player-store";
import { Play, Pause, Music2, ChevronLeft, Headphones } from "lucide-react";
import LikeButton from "@/components/like-button";
import AddToPlaylist from "@/components/add-to-playlist";
import ShareButton from "@/components/share-button";
import DownloadButton from "@/components/download-button";
import WhatsAppBanner from "@/components/whatsapp-banner";

type TrackWithMeta = Track & { genre: string | null; plays: number | null };

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function TrackPageClient({ track }: { track: TrackWithMeta }) {
  const { play, toggle, queue, currentIndex, playing } = usePlayer();
  const currentTrack = queue[currentIndex];
  const isActive = currentTrack?.id === track.id;
  const [plays, setPlays] = useState<number | null>(track.plays);

  useEffect(() => {
    if (!isActive && queue.length === 0) {
      usePlayer.setState({ queue: [track], currentIndex: 0, playing: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh play count when this track becomes active (just played)
  useEffect(() => {
    if (!isActive) return;
    fetch(`/api/tracks/${track.id}`)
      .then(r => r.json())
      .then(data => { if (data?.plays != null) setPlays(data.plays); })
      .catch(() => {});
  }, [isActive, track.id]);

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-b from-[var(--background)] via-[var(--background)] to-black/40">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative px-3 sm:px-4 md:px-8 pt-4 sm:pt-6 md:pt-10 pb-6 sm:pb-8 md:pb-16 max-w-7xl mx-auto">
        {/* Ambient glow from cover */}
        {track.coverUrl && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] opacity-15 sm:opacity-20 blur-[100px] sm:blur-[120px] pointer-events-none">
            <div className="w-full h-full bg-gradient-radial from-[var(--primary)] via-purple-500/30 to-transparent" />
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

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 md:gap-12">
          {/* Artwork */}
          <div className="relative shrink-0 group">
            {isActive && playing && (
              <div className="absolute -inset-3 sm:-inset-4 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[var(--primary)]/20 via-purple-500/10 to-transparent blur-xl sm:blur-2xl animate-pulse pointer-events-none" />
            )}
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/10 backdrop-blur-sm">
              {track.coverUrl ? (
                <Image src={track.coverUrl} alt={track.title} fill sizes="(max-width: 640px) 192px, (max-width: 768px) 256px, 320px" className="object-cover transition-transform duration-700 group-hover:scale-110" priority />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center">
                  <Music2 size={64} className="sm:w-20 sm:h-20 text-white/10" />
                </div>
              )}
              {/* Visualizer overlay when playing */}
              {isActive && playing && (
                <div className="absolute inset-0 flex items-end justify-center pb-4 sm:pb-6 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                  <div className="flex items-end gap-0.5 sm:gap-1">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((i) => (
                      <span
                        key={i}
                        className="rounded-full bg-gradient-to-t from-[var(--primary)] to-white shadow-[0_0_8px_rgba(30,215,96,0.6)]"
                        style={{
                          width: "2.5px",
                          animationName: "bar-bounce",
                          animationDuration: `${0.4 + (i % 4) * 0.15}s`,
                          animationTimingFunction: "ease-in-out",
                          animationIterationCount: "infinite",
                          animationDelay: `${i * 0.05}s`,
                          height: `${10 + (i % 6) * 5}px`,
                          transformOrigin: "bottom",
                          display: "inline-block",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 w-full text-center sm:text-left space-y-3 sm:space-y-4 md:space-y-6">
            {/* Genre + plays */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/[0.07] backdrop-blur-sm border border-white/10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/60 shadow-sm">
                {track.genre || "Music"}
              </span>
              {plays != null && (
                <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[9px] sm:text-[10px] font-bold text-[var(--primary)] backdrop-blur-sm">
                  <Headphones size={11} />
                  {plays.toLocaleString()}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-2 sm:mb-3 md:mb-4 bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] px-2 sm:px-0">
                {track.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg px-2 sm:px-0">
                <Link
                  href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`}
                  className="font-bold text-white/90 hover:text-[var(--primary)] transition-colors underline decoration-white/20 hover:decoration-[var(--primary)] underline-offset-2 sm:underline-offset-4"
                >
                  {track.artist}
                </Link>
                {track.featuredArtists && (
                  <span className="text-white/50 font-medium text-xs sm:text-sm md:text-base">feat. {track.featuredArtists}</span>
                )}
                {track.duration && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="text-white/40 text-xs sm:text-sm font-semibold tabular-nums">{fmt(track.duration)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
              <button
                onClick={() => isActive ? toggle() : play(track)}
                className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-black text-xs sm:text-sm uppercase tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_4px_24px_rgba(30,215,96,0.3)] hover:shadow-[0_8px_32px_rgba(30,215,96,0.4)]"
              >
                {isActive && playing
                  ? <><Pause size={16} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" /> <span className="hidden xs:inline">Pause</span></>
                  : <><Play size={16} className="sm:w-[18px] sm:h-[18px] ml-0.5" fill="currentColor" /> <span className="hidden xs:inline">Play</span></>
                }
              </button>

              <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-full shadow-lg">
                <LikeButton trackId={track.id} size={16} />
                <AddToPlaylist trackId={track.id} />
                <DownloadButton audioUrl={track.audioUrl} title={track.title} artist={track.artist} coverUrl={track.coverUrl} />
                <ShareButton title={`${track.title} by ${track.artist}`} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WhatsApp Banner ──────────────────────────────── */}
      <div className="px-3 sm:px-4 md:px-8 max-w-7xl mx-auto mb-8 sm:mb-10 md:mb-12">
        <WhatsAppBanner />
      </div>

      {/* ── More From Artist ─────────────────────────────── */}
      {(track as any).moreFromArtist?.length === 0 && (
        <section className="px-3 sm:px-4 md:px-8 max-w-7xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-base sm:text-lg md:text-xl font-black text-white mb-4 sm:mb-5">More from {track.artist}</h2>
          <div className="flex flex-col items-center justify-center py-10 sm:py-12 md:py-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 backdrop-blur-sm text-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center">
              <Music2 size={24} className="sm:w-8 sm:h-8 text-white/20" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white/50 px-4">No other songs from {track.artist} yet</p>
            <Link href={`/artist/${track.artistSlug || track.artistId}`} className="text-[10px] sm:text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors uppercase tracking-wide">
              View artist profile
            </Link>
          </div>
        </section>
      )}
      {(track as any).moreFromArtist?.length > 0 && (
        <section className="px-3 sm:px-4 md:px-8 max-w-7xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
            <h2 className="text-base sm:text-lg md:text-xl font-black text-white">More from {track.artist}</h2>
            <Link href={`/artist/${track.artistSlug || track.artistId}`} className="text-[10px] sm:text-xs font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors uppercase tracking-wide">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {(track as any).moreFromArtist.map((t: any) => {
              const isThisActive = currentTrack?.id === t.id;
              return (
                <Link
                  key={t.id}
                  href={`/track/${t.slug || t.id}`}
                  className="group flex items-center gap-2.5 sm:gap-3 md:gap-3.5 p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl overflow-hidden bg-[var(--surface-2)] shrink-0 shadow-lg">
                    {t.coverUrl
                      ? <Image src={t.coverUrl} alt={t.title} width={56} height={56} className="object-cover transition-transform duration-300 group-hover:scale-110" />
                      : <div className="w-full h-full flex items-center justify-center text-lg sm:text-xl opacity-20">♪</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-bold truncate transition-colors ${isThisActive ? "text-[var(--primary)]" : "group-hover:text-white"}`}>{t.title}</p>
                    <p className="text-[10px] sm:text-xs text-[var(--muted)] truncate">{t.artist}</p>
                  </div>
                  {t.duration && <span className="text-[9px] sm:text-[10px] text-white/30 tabular-nums shrink-0 font-semibold hidden xs:block">{fmt(t.duration)}</span>}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      isThisActive ? toggle() : play(t);
                    }}
                    className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-[var(--primary)] hover:text-black flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md"
                  >
                    {isThisActive && playing
                      ? <Pause size={13} className="sm:w-[14px] sm:h-[14px]" fill="currentColor" />
                      : <Play size={13} className="sm:w-[14px] sm:h-[14px] ml-0.5" fill="currentColor" />
                    }
                  </button>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Up Next ──────────────────────────────────────── */}
      {queue.length > 1 && (
        <section className="px-3 sm:px-4 md:px-8 max-w-5xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-base sm:text-lg md:text-xl font-black mb-4 sm:mb-5 md:mb-6">Up Next</h2>
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-md border border-white/10 shadow-2xl divide-y divide-white/5">
            {queue.slice(currentIndex + 1, currentIndex + 6).map((t, i) => (
              <div
                key={`${t.id}-${i}`}
                className="group flex items-center gap-2.5 sm:gap-3 md:gap-5 px-3 sm:px-4 md:px-6 py-3 sm:py-3.5 md:py-4 hover:bg-white/[0.03] transition-all cursor-pointer"
              >
                <span className="text-[10px] sm:text-xs font-black text-white/30 w-4 sm:w-5 text-center shrink-0 tabular-nums">{i + 1}</span>
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl overflow-hidden bg-[var(--surface-2)] shrink-0 shadow-lg">
                  {t.coverUrl && (
                    <Image src={t.coverUrl} alt={t.title} width={56} height={56} className="object-cover transition-transform duration-300 group-hover:scale-110" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm md:text-base font-bold truncate group-hover:text-[var(--primary)] transition-colors">{t.title}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-[var(--muted)] truncate">{t.artist}</p>
                </div>
                {t.duration && (
                  <span className="text-[10px] sm:text-xs md:text-sm text-[var(--muted)] tabular-nums shrink-0 font-semibold">{fmt(t.duration)}</span>
                )}
              </div>
            ))}
            {queue.length - currentIndex - 1 > 5 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 text-center bg-white/[0.02]">
                <span className="text-[10px] sm:text-xs font-bold text-white/30 uppercase tracking-wider">
                  +{queue.length - currentIndex - 6} more tracks
                </span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
