"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlayer, type Track } from "@/lib/player-store";
import { Play, Pause, Music2, ChevronLeft, Radio, Clock, Calendar, Headphones } from "lucide-react";
import LikeButton from "@/components/like-button";
import AddToPlaylist from "@/components/add-to-playlist";
import ShareButton from "@/components/share-button";
import DownloadButton from "@/components/download-button";
import WhatsAppBanner from "@/components/whatsapp-banner";
import TrackComments from "@/components/track-comments";
import LyricsView from "@/components/player/lyrics-view";
import TrackListItem from "@/components/track-list-item";
import { useTheme } from "@/components/theme-provider";

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

function useDominantColor(src: string | undefined) {
  const { theme } = useTheme();
  const [color, setColor] = useState(theme === "light" ? "220,220,225" : "25,25,30");
  useEffect(() => {
    if (!src) return;
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 32, 32);
        const { data } = ctx.getImageData(0, 0, 32, 32);
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          const br = (data[i] + data[i+1] + data[i+2]) / 3;
          if (br < 20 || br > 235) continue;
          r += data[i]; g += data[i+1]; b += data[i+2]; count++;
        }
        if (count > 0) setColor(`${Math.round(r/count)},${Math.round(g/count)},${Math.round(b/count)}`);
      } catch {}
    };
  }, [src]);
  return color;
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
  const { theme } = useTheme();
  const isLight = useMemo(() => theme === "light", [theme]);
  const dominantColor = useDominantColor(track.coverUrl);

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

  const blurOverlay = useMemo(() => {
    if (isLight) {
      return `linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.85) 70%, var(--background) 100%)`;
    }
    return `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.85) 70%, #000 100%)`;
  }, [isLight]);

  const dynamicBackground = useMemo(() => {
    if (!track.coverUrl) return undefined;
    if (isLight) {
      return `radial-gradient(ellipse at 50% -20%, rgba(${dominantColor},0.3) 0%, transparent 70%)`;
    }
    return `radial-gradient(ellipse at 50% -20%, rgba(${dominantColor},0.4) 0%, transparent 70%)`;
  }, [dominantColor, isLight, track.coverUrl]);

  const handlePlay = useCallback(() => {
    isActive ? toggle() : play(track);
  }, [isActive, toggle, play, track]);

  return (
    <div className="min-h-screen pb-32" style={{ background: isLight ? "#f5f5f7" : "#000" }}>
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {track.coverUrl ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${track.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: `blur(100px) saturate(200%) brightness(${isLight ? 1.5 : 0.2})`,
                transform: "scale(1.5)",
              }}
            />
            <div className="absolute inset-0" style={{ background: blurOverlay }} />
          </>
        ) : null}
        <div
          className="absolute inset-0"
          style={{ background: dynamicBackground ?? "transparent" }}
        />
      </div>

      {/* Nav */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderBottom: isLight ? "0.5px solid rgba(0,0,0,0.06)" : "0.5px solid rgba(255,255,255,0.06)",
          background: isLight ? "rgba(245,245,247,0.8)" : "rgba(0,0,0,0.7)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
          style={{ color: isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)" }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color: isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)" }}
        >
          Now Playing
        </p>
        <div className="w-12" />
      </header>

      {/* Hero */}
      <section className="px-5 pt-8 pb-6 w-full">
        <div className="flex flex-col items-center text-center gap-5">
          {/* Art — large, prominent, like Apple Music */}
          <div
            className="relative w-56 h-56 md:w-64 md:h-64 shrink-0 rounded-xl overflow-hidden"
            style={{
              boxShadow: isLight
                ? "0 24px 80px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.04)"
                : "0 24px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.06)",
            }}
          >
            {track.coverUrl ? (
              <Image src={track.coverUrl} alt={track.title} fill sizes="256px" className="object-cover" priority unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: isLight ? "#e8e8ee" : "#1c1c26" }}>
                <Music2 size={40} style={{ color: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }} />
              </div>
            )}
          </div>

          {/* Identity — centered, spacious */}
          <div className="max-w-md">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2"
              style={{ color: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)" }}
            >
              {track.genre || "Single"}
            </p>
            <h1 className="text-2xl md:text-3xl font-black leading-tight mb-1.5">{track.title}</h1>
            <Link
              href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`}
              className="text-base font-semibold transition-colors inline-block"
              style={{ color: isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)" }}
            >
              {track.artist}
            </Link>
            {track.featuredArtists && (
              <span className="text-sm" style={{ color: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)" }}>
                {" "}feat. {track.featuredArtists}
              </span>
            )}

            {/* Meta row — icon + text */}
            <div
              className="flex items-center justify-center gap-4 mt-3 text-xs font-medium"
              style={{ color: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)" }}
            >
              {plays != null && (
                <span className="flex items-center gap-1">
                  <Headphones size={11} />
                  {plays.toLocaleString()}
                </span>
              )}
              {actualDuration && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {fmt(actualDuration)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {track.releaseYear || new Date().getFullYear()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #1ed760, #15a047)",
                color: "#000",
                boxShadow: isLight
                  ? "0 4px 16px rgba(30,215,96,0.3)"
                  : "0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              {isActive && playing ? (
                <Pause size={20} fill="currentColor" strokeWidth={0} />
              ) : (
                <Play size={20} fill="currentColor" strokeWidth={0} className="mr-[1px]" />
              )}
              {isActive && playing ? "Pause" : "Play"}
            </button>

            <div
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
              style={{ background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)" }}
            >
              <LikeButton trackId={track.id} size={18} />
            </div>
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
              style={{ background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)" }}
            >
              <AddToPlaylist trackId={track.id} />
            </div>
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
              style={{ background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)" }}
            >
              <DownloadButton audioUrl={track.audioUrl} title={track.title} artist={track.artist} featuredArtists={track.featuredArtists} coverUrl={track.coverUrl} />
            </div>
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
              style={{ background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)" }}
            >
              <ShareButton title={`${track.title} by ${track.artist}`} />
            </div>

            <button
              onClick={() => router.push(`/radio/${track.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-90"
              style={{
                background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)",
                color: isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)",
                border: isLight ? "0.5px solid rgba(0,0,0,0.06)" : "0.5px solid rgba(255,255,255,0.06)",
              }}
            >
              <Radio size={12} /> Radio
            </button>
          </div>
        </div>
      </section>

      {/* Apple-style pill segmented control */}
      <section className="px-5 w-full mb-5">
        <div
          className="flex p-1 rounded-xl w-fit mx-auto"
          style={{
            background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
          }}
        >
          {(["lyrics", "related", "credits"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all"
              style={{
                color: activeTab === tab
                  ? (isLight ? "#000" : "#fff")
                  : (isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)"),
                background: activeTab === tab
                  ? (isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)")
                  : "transparent",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Tab content — frosted glass card */}
      <section className="px-5 w-full mb-6">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.04)",
            border: isLight ? "0.5px solid rgba(0,0,0,0.06)" : "0.5px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {activeTab === "lyrics" && (
            track.syncedLyrics ? (
              <div className="h-[60vh] relative overflow-hidden">
                <LyricsView trackId={track.id} progress={progress} className="h-full" />
              </div>
            ) : track.lyrics ? (
              <div className="p-6 max-h-72 overflow-y-auto custom-scrollbar">
                <p
                  className="text-sm leading-[1.9] whitespace-pre-line"
                  style={{ color: isLight ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.65)" }}
                >
                  {track.lyrics}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 gap-3" style={{ color: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }}>
                <Music2 size={28} />
                <p className="text-sm font-semibold">Lyrics not available</p>
              </div>
            )
          )}

          {activeTab === "related" && (
            (track as any).moreFromArtist?.length > 0 ? (
              (track as any).moreFromArtist.map((t: any, idx: number) => (
                <TrackListItem key={t.id} track={t} index={idx} tracks={(track as any).moreFromArtist} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-14 gap-3" style={{ color: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }}>
                <Music2 size={28} />
                <p className="text-sm font-semibold">No related tracks</p>
              </div>
            )
          )}

          {activeTab === "credits" && (
            <div className="divide-y" style={{ borderColor: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)" }}>
              {[
                ["Artist", track.artist],
                ...(track.featuredArtists ? [["Featured", track.featuredArtists]] : []),
                ["Genre", track.genre || "Unknown"],
                ["Duration", actualDuration ? fmt(actualDuration) : "Unknown"],
                ["Year", String(track.releaseYear || new Date().getFullYear())],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center px-5 py-3.5" style={{ borderColor: "inherit" }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)" }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: isLight ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)" }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WhatsApp Banner */}
      <div className="px-5 w-full mb-6">
        <WhatsAppBanner />
      </div>

      {/* Up Next */}
      {queue.length > 1 && (
        <section className="px-5 w-full mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)" }}>
            Up Next <span style={{ color: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }}>({queue.length - currentIndex - 1})</span>
          </h2>
          <div
            className="rounded-2xl overflow-hidden divide-y"
            style={{
              background: isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.04)",
              border: isLight ? "0.5px solid rgba(0,0,0,0.06)" : "0.5px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderColor: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
            }}
          >
            {queue.slice(currentIndex + 1, currentIndex + 6).map((t, i) => (
              <div key={`${t.id}-${i}`} className="flex items-center gap-3 px-4 py-2.5" style={{ borderColor: "inherit" }}>
                <span className="text-xs w-4 text-center tabular-nums font-mono shrink-0" style={{ color: isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }}>
                  {i + 1}
                </span>
                <div
                  className="relative w-9 h-9 shrink-0 rounded-md overflow-hidden"
                  style={{ background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)" }}
                >
                  {t.coverUrl && <Image src={t.coverUrl} alt={t.title} width={36} height={36} className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: isLight ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)" }}>{t.title}</p>
                  <p className="text-xs truncate" style={{ color: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)" }}>{t.artist}</p>
                </div>
                {t.duration && (
                  <span className="text-xs tabular-nums font-mono shrink-0" style={{ color: isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)" }}>
                    {fmt(t.duration)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <section className="px-5 w-full mb-8">
        <TrackComments trackId={track.id} />
      </section>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"}; border-radius: 4px; }
      `}</style>
    </div>
  );
}
