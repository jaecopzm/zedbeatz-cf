"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlayer, type Track } from "@/lib/player-store";
import { Play, Pause, Music2, ChevronLeft, Headphones, Clock, Calendar, Radio } from "lucide-react";
import LikeButton from "@/components/like-button";
import AddToPlaylist from "@/components/add-to-playlist";
import ShareButton from "@/components/share-button";
import DownloadButton from "@/components/download-button";
import WhatsAppBanner from "@/components/whatsapp-banner";
import TrackComments from "@/components/track-comments";

type TrackWithMeta = Track & { genre: string | null; plays: number | null; lyrics?: string | null; releaseYear?: number };

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function TrackPageClient({ track }: { track: TrackWithMeta }) {
  const router = useRouter();
  const { play, toggle, queue, currentIndex, playing } = usePlayer();
  const currentTrack = queue[currentIndex];
  const isActive = currentTrack?.id === track.id;
  const [plays, setPlays] = useState<number | null>(track.plays);
  const [activeTab, setActiveTab] = useState<"about" | "lyrics" | "credits">("about");
  const [actualDuration, setActualDuration] = useState<number | undefined>(track.duration);

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

  return (
    <div className="min-h-screen pb-32">
      {/* ── Hero ── */}
      <section className="relative px-4 md:px-8 pt-4 pb-6 max-w-5xl mx-auto">
        {track.coverUrl && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: `url(${track.coverUrl})`, backgroundSize: "cover", filter: "blur(80px) saturate(150%) brightness(0.25)", transform: "scale(1.2)" }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--background)]" />
          </div>
        )}

        <Link href="/" className="relative inline-flex items-center gap-1 text-xs text-white/50 hover:text-white mb-4 group">
          <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> Back
        </Link>

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
          {/* Cover */}
          <div className="relative shrink-0 w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 shadow-2xl">
            {track.coverUrl
              ? <Image src={track.coverUrl} alt={track.title} fill sizes="240px" className="object-cover" priority unoptimized />
              : <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center"><Music2 size={48} className="text-white/10" /></div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{track.genre || "Single"}</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-2">{track.title}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-sm mb-3">
              <Link href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`} className="font-bold hover:text-[var(--primary)] transition-colors">{track.artist}</Link>
              {track.featuredArtists && <span className="text-white/50">feat. {track.featuredArtists}</span>}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-white/40 mb-4">
              {plays != null && <span className="flex items-center gap-1"><Headphones size={11} />{plays.toLocaleString()} plays</span>}
              {actualDuration && <span className="flex items-center gap-1"><Clock size={11} />{fmt(actualDuration)}</span>}
              <span className="flex items-center gap-1"><Calendar size={11} />{track.releaseYear || new Date().getFullYear()}</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button onClick={() => isActive ? toggle() : play(track)} className="flex items-center gap-2 px-7 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-black text-sm transition-all hover:scale-105 active:scale-95">
                {isActive && playing ? <><Pause size={15} fill="currentColor" />Pause</> : <><Play size={15} fill="currentColor" className="ml-0.5" />Play</>}
              </button>
              <button onClick={() => router.push(`/radio/${track.id}`)} className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold transition-colors">
                <Radio size={14} /><span className="hidden sm:inline">Radio</span>
              </button>
              <div className="flex items-center gap-0.5 p-1 bg-white/5 border border-white/10">
                <LikeButton trackId={track.id} size={16} />
                <AddToPlaylist trackId={track.id} />
                <DownloadButton audioUrl={track.audioUrl} title={track.title} artist={track.artist} coverUrl={track.coverUrl} />
                <ShareButton title={`${track.title} by ${track.artist}`} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <section className="px-4 md:px-8 max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-1 mb-4 border-b border-white/10">
          {(["about", "lyrics", "credits"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab ? "border-[var(--primary)] text-white" : "border-transparent text-white/40 hover:text-white"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/10 p-4 md:p-6">
          {activeTab === "about" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 border border-white/10">
                  <div className="text-xl font-black mb-0.5">{plays?.toLocaleString() || "0"}</div>
                  <div className="text-xs text-white/40">Total Plays</div>
                </div>
                <div className="bg-white/5 p-3 border border-white/10">
                  <div className="text-xl font-black mb-0.5">{actualDuration ? fmt(actualDuration) : "—"}</div>
                  <div className="text-xs text-white/40">Duration</div>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                {track.title} is a {track.genre?.toLowerCase() || "music"} track by {track.artist}{track.featuredArtists && ` featuring ${track.featuredArtists}`}.
              </p>
            </div>
          )}
          {activeTab === "lyrics" && (
            track.lyrics
              ? <div className="text-sm text-white/80 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto custom-scrollbar">{track.lyrics}</div>
              : <div className="text-center py-10 text-sm text-white/40">Lyrics not available</div>
          )}
          {activeTab === "credits" && (
            <div className="divide-y divide-white/10">
              {[
                ["Artist", track.artist],
                ...(track.featuredArtists ? [["Featured", track.featuredArtists]] : []),
                ["Genre", track.genre || "Unknown"],
                ["Duration", actualDuration ? fmt(actualDuration) : "Unknown"],
                ["Year", String(track.releaseYear || new Date().getFullYear())],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2.5 text-sm">
                  <span className="text-white/40">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── WhatsApp Banner ── */}
      <div className="px-4 md:px-8 max-w-5xl mx-auto mb-6"><WhatsAppBanner /></div>

      {/* ── More From Artist ── */}
      {(track as any).moreFromArtist?.length > 0 && (
        <section className="px-4 md:px-8 max-w-5xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-base">More from {track.artist}</h2>
            <Link href={`/artist/${track.artistSlug || track.artistId}`} className="text-xs text-white/40 hover:text-white">See all</Link>
          </div>
          <div className="divide-y divide-white/5">
            {(track as any).moreFromArtist.map((t: any) => {
              const isThisActive = currentTrack?.id === t.id;
              return (
                <div key={t.id} className="flex items-center gap-3 py-2 hover:bg-white/5 px-2 cursor-pointer group" onClick={() => isThisActive ? toggle() : play(t)}>
                  <div className="relative w-9 h-9 shrink-0 bg-[var(--surface-2)]">
                    {t.coverUrl && <Image src={t.coverUrl} alt={t.title} width={36} height={36} className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isThisActive ? "text-[var(--primary)]" : ""}`}>{t.title}</p>
                    <p className="text-xs text-white/40 truncate">{t.artist}</p>
                  </div>
                  {t.duration && <span className="text-xs text-white/30 tabular-nums">{fmt(t.duration)}</span>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Up Next ── */}
      {queue.length > 1 && (
        <section className="px-4 md:px-8 max-w-5xl mx-auto mb-6">
          <h2 className="font-black text-base mb-3">Up Next <span className="text-white/30 font-normal text-sm">({queue.length - currentIndex - 1})</span></h2>
          <div className="divide-y divide-white/5">
            {queue.slice(currentIndex + 1, currentIndex + 6).map((t, i) => (
              <div key={`${t.id}-${i}`} className="flex items-center gap-3 py-2 px-2">
                <span className="text-xs text-white/30 w-4 text-center tabular-nums">{i + 1}</span>
                <div className="relative w-9 h-9 shrink-0 bg-[var(--surface-2)]">
                  {t.coverUrl && <Image src={t.coverUrl} alt={t.title} width={36} height={36} className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.title}</p>
                  <p className="text-xs text-white/40 truncate">{t.artist}</p>
                </div>
                {t.duration && <span className="text-xs text-white/30 tabular-nums">{fmt(t.duration)}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Comments ── */}
      <section className="px-4 md:px-8 max-w-5xl mx-auto mb-8">
        <TrackComments trackId={track.id} />
      </section>
    </div>
  );
}
