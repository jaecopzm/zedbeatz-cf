"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlayer, type Track } from "@/lib/player-store";
import { Play, Pause, Music2, ChevronLeft, Radio } from "lucide-react";
import LikeButton from "@/components/like-button";
import AddToPlaylist from "@/components/add-to-playlist";
import ShareButton from "@/components/share-button";
import DownloadButton from "@/components/download-button";
import WhatsAppBanner from "@/components/whatsapp-banner";
import TrackComments from "@/components/track-comments";
import LyricsView from "@/components/player/lyrics-view";

type TrackWithMeta = Track & {
  genre: string | null;
  plays: number | null;
  lyrics?: string | null;
  syncedLyrics?: string | null;
  releaseYear?: number;
};

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function TrackPageClient({ track }: { track: TrackWithMeta }) {
  const router = useRouter();
  const { play, toggle, queue, currentIndex, playing } = usePlayer();
  const currentTrack = queue[currentIndex];
  const isActive = currentTrack?.id === track.id;
  const [plays, setPlays] = useState<number | null>(track.plays);
  const [activeTab, setActiveTab] = useState<"lyrics" | "related" | "credits">("lyrics");
  const [actualDuration, setActualDuration] = useState<number | undefined>(track.duration);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive && queue.length === 0) {
      usePlayer.setState({ queue: [track], currentIndex: 0, playing: false });
    }
  }, []);

  useEffect(() => {
    const audio = document.querySelector("audio");
    if (isActive && audio) {
      const update = () => {
        if (audio.duration && !isNaN(audio.duration))
          setActualDuration(Math.floor(audio.duration));
      };
      const onTime = () => setProgress(audio.currentTime);
      audio.addEventListener("loadedmetadata", update);
      audio.addEventListener("timeupdate", onTime);
      if (audio.duration) update();
      return () => {
        audio.removeEventListener("loadedmetadata", update);
        audio.removeEventListener("timeupdate", onTime);
      };
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    fetch(`/api/tracks/${track.id}`)
      .then((r) => r.json())
      .then((data) => { if (data?.plays != null) setPlays(data.plays); })
      .catch(() => {});
  }, [isActive, track.id]);

  return (
    <div className="min-h-screen pb-32">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {track.coverUrl ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${track.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(120px) saturate(180%) brightness(0.18)",
                transform: "scale(1.4)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/95" />
          </>
        ) : (
          <div className="absolute inset-0 bg-background" />
        )}
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-2xl bg-background/20 border-b border-[var(--border)]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-semibold text-foreground/60 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Track</p>
        <div className="w-10" />
      </header>

      {/* Hero — horizontal on mobile too */}
      <section className="px-4 pt-5 pb-4 w-full md:max-w-none mx-auto">
        <div className="flex gap-4 items-center mb-4">
          {/* Art */}
          <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden shadow-2xl">
            {track.coverUrl ? (
              <Image src={track.coverUrl} alt={track.title} fill sizes="96px" className="object-cover" priority unoptimized />
            ) : (
              <div className="w-full h-full bg-[var(--glass-hover)] flex items-center justify-center">
                <Music2 size={28} className="text-foreground/20" />
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 mb-0.5">
              {track.genre || "Single"}
            </p>
            <h1 className="text-lg font-black leading-tight truncate mb-0.5">{track.title}</h1>
            <Link
              href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`}
              className="text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors"
            >
              {track.artist}
            </Link>
            {track.featuredArtists && (
              <span className="text-xs text-foreground/40"> feat. {track.featuredArtists}</span>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-foreground/30">
              {plays != null && <span>{plays.toLocaleString()} plays</span>}
              {actualDuration && <span>{fmt(actualDuration)}</span>}
              <span>{track.releaseYear || new Date().getFullYear()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (isActive ? toggle() : play(track))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-black transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #1db954, #17a348)" }}
          >
            {isActive && playing ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" className="ml-0.5" />}
            {isActive && playing ? "Pause" : "Play"}
          </button>

          <LikeButton trackId={track.id} size={20} />
          <AddToPlaylist trackId={track.id} />
          <DownloadButton audioUrl={track.audioUrl} title={track.title} artist={track.artist} featuredArtists={track.featuredArtists} coverUrl={track.coverUrl} />
          <ShareButton title={`${track.title} by ${track.artist}`} />

          <button
            onClick={() => router.push(`/radio/${track.id}`)}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--glass-hover)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-foreground/60 hover:text-foreground transition-all"
          >
            <Radio size={12} /> Radio
          </button>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 w-full md:max-w-none mx-auto mb-2">
        <div className="flex items-center border-b border-[var(--border)]">
          {(["lyrics", "related", "credits"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab ? "text-foreground" : "text-foreground/30 hover:text-foreground/60"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[var(--primary)]" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Tab content */}
      <section className="px-4 w-full md:max-w-none mx-auto mb-6">
        <div className="rounded-xl bg-[var(--glass-hover)] border border-[var(--border)] overflow-hidden">
          {activeTab === "lyrics" && (
            track.syncedLyrics ? (
              <div className="h-[60vh] relative overflow-hidden">
                <LyricsView trackId={track.id} progress={progress} className="h-full" />
              </div>
            ) : track.lyrics ? (
              <div className="p-5 max-h-72 overflow-y-auto custom-scrollbar">
                <p className="text-sm text-foreground/70 leading-[1.9] whitespace-pre-line">{track.lyrics}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-foreground/20">
                <Music2 size={28} />
                <p className="text-sm font-semibold">Lyrics not available</p>
              </div>
            )
          )}

          {activeTab === "related" && (
            (track as any).moreFromArtist?.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {(track as any).moreFromArtist.map((t: any, idx: number) => {
                  const isThisActive = currentTrack?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--glass-hover)] cursor-pointer group transition-colors"
                      onClick={() => (isThisActive ? toggle() : play(t))}
                    >
                      <span className="w-4 flex items-center justify-center shrink-0">
                        {isThisActive && playing ? (
                          <span className="eq-container" aria-hidden>
                            {[0.3, 0.7, 0.5, 0.9, 0.4].map((delay, i) => (
                              <span key={i} className="eq-bar eq-bar--active" style={{ animationDelay: `${delay}s` }} />
                            ))}
                          </span>
                        ) : isThisActive ? (
                          <Play size={12} fill="#1db954" className="text-[#1db954]" />
                        ) : (
                          <>
                            <span className="text-xs text-foreground/20 tabular-nums font-mono group-hover:hidden">{idx + 1}</span>
                            <Play size={12} className="text-foreground/60 hidden group-hover:block" />
                          </>
                        )}
                      </span>
                      <div className="relative w-9 h-9 shrink-0 rounded-md bg-[var(--glass-hover)] overflow-hidden">
                        {t.coverUrl && <Image src={t.coverUrl} alt={t.title} width={36} height={36} className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isThisActive ? "text-[#1db954]" : "text-foreground"}`}>{t.title}</p>
                        <p className="text-xs text-foreground/40 truncate">{t.artist}</p>
                      </div>
                      {t.duration && <span className="text-xs text-foreground/30 tabular-nums font-mono shrink-0">{fmt(t.duration)}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-foreground/20">
                <Music2 size={28} />
                <p className="text-sm font-semibold">No related tracks</p>
              </div>
            )
          )}

          {activeTab === "credits" && (
            <div className="divide-y divide-[var(--border)]">
              {[
                ["Artist", track.artist],
                ...(track.featuredArtists ? [["Featured", track.featuredArtists]] : []),
                ["Genre", track.genre || "Unknown"],
                ["Duration", actualDuration ? fmt(actualDuration) : "Unknown"],
                ["Year", String(track.releaseYear || new Date().getFullYear())],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center px-5 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground/30">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WhatsApp Banner */}
      <div className="px-4 w-full md:max-w-none mx-auto mb-6">
        <WhatsAppBanner />
      </div>

      {/* Up Next */}
      {queue.length > 1 && (
        <section className="px-4 w-full md:max-w-none mx-auto mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-foreground/50 mb-3">
            Up Next <span className="text-foreground/20 font-normal">({queue.length - currentIndex - 1})</span>
          </h2>
          <div className="rounded-xl overflow-hidden bg-[var(--glass-hover)] border border-[var(--border)] divide-y divide-[var(--border)]">
            {queue.slice(currentIndex + 1, currentIndex + 6).map((t, i) => (
              <div key={`${t.id}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs text-foreground/20 w-4 text-center tabular-nums font-mono shrink-0">{i + 1}</span>
                <div className="relative w-9 h-9 shrink-0 rounded-md bg-[var(--glass-hover)] overflow-hidden">
                  {t.coverUrl && <Image src={t.coverUrl} alt={t.title} width={36} height={36} className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground/80">{t.title}</p>
                  <p className="text-xs text-foreground/40 truncate">{t.artist}</p>
                </div>
                {t.duration && (
                  <span className="text-xs text-foreground/30 tabular-nums font-mono shrink-0">{fmt(t.duration)}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <section className="px-4 w-full md:max-w-none mx-auto mb-8">
        <TrackComments trackId={track.id} />
      </section>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
      `}</style>
    </div>
  );
}
