"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/player-store";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, List, X, ChevronDown,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import Link from "next/link";
import LikeButton from "@/components/like-button";
import ShareButton from "@/components/share-button";
import DownloadButton from "@/components/download-button";
import WhatsAppBanner from "@/components/whatsapp-banner";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function Player() {
  const { queue, currentIndex, playing, shuffle, repeat, toggle, next, prev, toggleShuffle, cycleRepeat, setQueue } = usePlayer();
  const track = queue[currentIndex];
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("player-volume");
      return saved ? parseFloat(saved) : 0.8;
    }
    return 0.8;
  });
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [showQueue, setShowQueue]         = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const playedTracksRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !track) return;
    if (a.src !== track.audioUrl) {
      a.pause(); a.src = track.audioUrl; a.load();
      if (playing) a.play().catch(() => {});
    } else if (playing && a.paused) {
      a.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.audioUrl]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !track) return;
    function handlePlay() {
      if (!playedTracksRef.current.has(track.id)) {
        playedTracksRef.current.add(track.id);
        fetch("/api/tracks/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: track.id }) }).catch(() => {});
        fetch("/api/recently-played", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track_id: track.id }) }).catch(() => {});
      }
    }
    a.addEventListener("play", handlePlay);
    return () => a.removeEventListener("play", handlePlay);
  }, [track?.id]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    playing ? a.play().catch(() => {}) : a.pause();
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (typeof window !== "undefined") localStorage.setItem("player-volume", volume.toString());
  }, [volume]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space")       { e.preventDefault(); toggle(); }
      else if (e.code === "ArrowRight") { e.preventDefault(); if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 5, duration); }
      else if (e.code === "ArrowLeft")  { e.preventDefault(); if (audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 5, 0); }
      else if (e.code === "ArrowUp")    { e.preventDefault(); setVolume(v => Math.min(v + 0.1, 1)); }
      else if (e.code === "ArrowDown")  { e.preventDefault(); setVolume(v => Math.max(v - 0.1, 0)); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, duration]);

  useEffect(() => {
    document.body.style.overflow = showFullScreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showFullScreen]);

  function handleEnded() {
    if (audioRef.current) audioRef.current.volume = volume;
    if (repeat === "one" && audioRef.current) {
      audioRef.current.currentTime = 0; audioRef.current.play();
    } else {
      const hasNext = currentIndex < queue.length - 1;
      if (hasNext || repeat === "all") next(); else toggle();
    }
  }

  function toggleMute() {
    if (volume > 0) { setPrevVolume(volume); setVolume(0); }
    else setVolume(prevVolume);
  }

  function handlePrev() {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      prev();
    }
  }

  if (!track) return null;

  /* ───────────────────────── Shared UI pieces ─────────────────────── */
  const EqBars = () => (
    <div className="flex items-end gap-[3px] h-4">
      {[1, 2, 3].map((i) => (
        <span key={i} className="w-[3px] bg-[var(--primary)] rounded-full eq-bar" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );

  return (
    <>
      {/* ── Audio element ─────────────────────────────── */}
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* ─────────────────── FULL-SCREEN NOW PLAYING ──────────────────── */}
      {showFullScreen && (
        <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
          style={{ background: "linear-gradient(160deg, #1a1a2e 0%, #0d0d14 50%, #0a0a0f 100%)" }}>
          {/* Ambient glow */}
          {track.coverUrl && (
            <div className="absolute inset-0 overflow-hidden z-0">
              <Image src={track.coverUrl} alt="" fill sizes="100vw" className="object-cover opacity-10 blur-3xl scale-110" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#0d0d14]/80 to-[#0a0a0f]" />
            </div>
          )}

          {/* ── DESKTOP: full two-column layout ── */}
          <div className="hidden lg:flex h-full relative z-10">

            {/* Left column: cover + controls */}
            <div className="flex-1 flex flex-col items-center justify-center px-12 py-4 min-w-0">

              {/* Top bar */}
              <div className="w-full max-w-xs flex items-center justify-between mb-3">
                <button onClick={() => setShowFullScreen(false)}
                  className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
                  <ChevronDown size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">Now Playing</span>
                </button>
                <div className="flex items-center gap-1">
                  <DownloadButton audioUrl={track.audioUrl} title={track.title} artist={track.artist} coverUrl={track.coverUrl} />
                  <ShareButton title={`${track.title} by ${track.artist}`} url={`${typeof window !== "undefined" ? window.location.origin : ""}/track/${track.slug || track.id}`} />
                </div>
              </div>

              {/* Cover art */}
              <div className="relative w-full max-w-xs aspect-square mb-4">
                {/* Glow */}
                <div className={`absolute -inset-6 rounded-full blur-3xl transition-opacity duration-1000 pointer-events-none ${playing ? "opacity-30" : "opacity-0"}`}
                  style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 65%)" }} />
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} fill priority
                    className={`object-cover rounded-2xl shadow-2xl transition-all duration-700 ${playing ? "scale-100" : "scale-[0.97]"}`}
                    style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }} />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)]" />
                )}
                {/* Visualizer overlay */}
                {playing && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl flex items-end justify-center gap-1 px-4 pb-3">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="flex-1 bg-[var(--primary)] rounded-full opacity-70"
                        style={{
                          height: '4px',
                          animationName: 'eq-bounce',
                          animationDuration: `${0.4 + Math.random() * 0.6}s`,
                          animationTimingFunction: 'ease-in-out',
                          animationIterationCount: 'infinite',
                          animationDirection: 'alternate',
                          animationDelay: `${i * 0.05}s`
                        }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="w-full max-w-xs flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1 mr-3">
                  <h1 className="text-xl font-black tracking-tight leading-tight text-white truncate">{track.title}</h1>
                  <p className="text-xs text-white/50 mt-0.5 truncate">
                    <Link href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`}
                      className="hover:text-white transition-colors">
                      {track.artist}
                    </Link>
                    {track.featuredArtists && <span className="text-[11px]"> feat. {track.featuredArtists}</span>}
                  </p>
                </div>
                <div onClick={e => e.stopPropagation()} className="shrink-0">
                  <LikeButton trackId={track.id} size={18} />
                </div>
              </div>

              {/* Progress */}
              <div className="w-full max-w-xs mb-3">
                <Slider value={[progress]} max={duration || 1} step={0.1}
                  onValueChange={([v]: number[]) => { if (audioRef.current) audioRef.current.currentTime = v; }}
                  className="mb-1.5" />
                <div className="flex justify-between text-[10px] text-white/40 tabular-nums font-medium">
                  <span>{fmt(progress)}</span><span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Transport */}
              <div className="w-full max-w-xs flex items-center justify-between mb-3">
                <button onClick={toggleShuffle}
                  className={`p-2 rounded-full transition-all ${shuffle ? "text-[var(--primary)]" : "text-white/30 hover:text-white hover:bg-white/10"}`}>
                  <Shuffle size={16} />
                </button>
                <button onClick={handlePrev} className="p-1.5 text-white/70 hover:text-white active:scale-90 transition-all">
                  <SkipBack size={24} fill="currentColor" />
                </button>
                <button onClick={toggle}
                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-2xl active:scale-95 hover:scale-105 transition-all"
                  style={{ boxShadow: "0 0 30px rgba(255,255,255,0.15), 0 6px 24px rgba(0,0,0,0.5)" }}>
                  {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={next} className="p-1.5 text-white/70 hover:text-white active:scale-90 transition-all">
                  <SkipForward size={24} fill="currentColor" />
                </button>
                <button onClick={cycleRepeat}
                  className={`p-2 rounded-full transition-all ${repeat !== "off" ? "text-[var(--primary)]" : "text-white/30 hover:text-white hover:bg-white/10"}`}>
                  {repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
                </button>
              </div>

              {/* Volume */}
              <div className="w-full max-w-xs flex items-center gap-2.5">
                <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors shrink-0">
                  {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <Slider value={[volume]} max={1} step={0.01} onValueChange={([v]: number[]) => setVolume(v)} className="flex-1" />
              </div>
            </div>

            {/* Right column: queue */}
            <div className="w-80 shrink-0 flex flex-col border-l border-white/[0.06] bg-black/20 backdrop-blur-sm">
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <List size={16} className="text-[var(--primary)]" />
                  <h3 className="font-bold text-sm text-white">Queue</h3>
                  <span className="text-xs text-white/30 tabular-nums">({queue.length})</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {queue.map((t, i) => (
                  <div key={`${t.id}-${i}`} onClick={() => setQueue(queue, i)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${i === currentIndex ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}>
                    <span className={`text-xs w-5 text-center tabular-nums shrink-0 flex items-center justify-center ${i === currentIndex ? "text-[var(--primary)]" : "text-white/30"}`}>
                      {i === currentIndex && playing ? <EqBars /> : i + 1}
                    </span>
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0">
                      {t.coverUrl && <Image src={t.coverUrl} alt={t.title} width={36} height={36} className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${i === currentIndex ? "text-[var(--primary)]" : "text-white"}`}>{t.title}</p>
                      <p className="text-xs text-white/40 truncate">{t.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MOBILE: original centered layout ── */}
          <div className="lg:hidden flex flex-col h-full">
            {/* Header */}
            <div className="relative flex items-center justify-between px-5 py-4 shrink-0">
              <button onClick={() => setShowFullScreen(false)} className="p-2.5 rounded-full hover:bg-white/10 transition-all active:scale-95">
                <ChevronDown size={24} className="text-white" strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass-card">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                <span className="text-xs font-semibold text-white/90 uppercase tracking-widest">Now Playing</span>
              </div>
              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`p-2.5 rounded-full transition-all active:scale-95 ${showQueue ? "text-[var(--primary)] bg-[var(--primary-dim)]" : "text-white/70 hover:bg-white/10"}`}
              >
                <List size={22} strokeWidth={2.5} />
              </button>
            </div>

            <div className="relative flex-1 flex flex-col items-center px-6 pb-8 gap-3 overflow-hidden" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
              {/* Album art */}
              <div className="relative w-full max-w-[320px] aspect-square shrink-0 mt-2">
                <div className={`absolute -inset-6 rounded-full blur-3xl transition-opacity duration-700 ${playing ? "opacity-40" : "opacity-0"}`}
                  style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }} />
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} fill
                    className={`object-cover rounded-2xl shadow-2xl transition-transform duration-700 ${playing ? "scale-100" : "scale-95"}`} priority />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)]" />
                )}
              </div>

              {/* Track info */}
              <div className="w-full max-w-md text-center px-4">
                <h1 className="text-xl font-bold mb-1 leading-tight text-white truncate">{track.title}</h1>
                <p className="text-sm text-[var(--muted)] font-medium truncate">
                  <Link href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`} className="hover:text-white transition-colors">
                    {track.artist}
                  </Link>
                  {track.featuredArtists && <span className="text-xs"> feat. {track.featuredArtists}</span>}
                </p>
              </div>

              {/* Progress */}
              <div className="w-full max-w-md px-2">
                <WhatsAppBanner className="mb-4" />
                <Slider value={[progress]} max={duration || 1} step={0.1}
                  onValueChange={([v]: number[]) => { if (audioRef.current) audioRef.current.currentTime = v; }} className="mb-2.5" />
                <div className="flex justify-between text-xs text-[var(--muted)] tabular-nums font-medium">
                  <span>{fmt(progress)}</span><span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Transport */}
              <div className="flex items-center justify-center gap-5 w-full max-w-xs">
                <button onClick={toggleShuffle} className={`p-2.5 rounded-full transition-all active:scale-90 ${shuffle ? "text-[var(--primary)] bg-[var(--primary-dim)]" : "text-white/50 hover:text-white hover:bg-white/10"}`}>
                  <Shuffle size={20} />
                </button>
                <button onClick={handlePrev} className="p-2 text-white/80 hover:text-white active:scale-90 transition-all">
                  <SkipBack size={28} fill="currentColor" />
                </button>
                <button onClick={toggle}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black shadow-2xl active:scale-95 transition-all hover:scale-105"
                  style={{ boxShadow: "0 0 40px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.4)" }}>
                  {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={next} className="p-2 text-white/80 hover:text-white active:scale-90 transition-all">
                  <SkipForward size={28} fill="currentColor" />
                </button>
                <button onClick={cycleRepeat} className={`p-2.5 rounded-full transition-all active:scale-90 ${repeat !== "off" ? "text-[var(--primary)] bg-[var(--primary-dim)]" : "text-white/50 hover:text-white hover:bg-white/10"}`}>
                  {repeat === "one" ? <Repeat1 size={20} /> : <Repeat size={20} />}
                </button>
              </div>

              {/* Like + Volume + Share + Download */}
              <div className="flex items-center justify-between w-full max-w-xs">
                <div onClick={e => e.stopPropagation()}><LikeButton trackId={track.id} size={20} /></div>
                <div className="flex items-center gap-3">
                  <button onClick={toggleMute} className="text-[var(--muted)] hover:text-white transition-colors">
                    {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <Slider value={[volume]} max={1} step={0.01} onValueChange={([v]: number[]) => setVolume(v)} className="w-24" />
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <DownloadButton audioUrl={track.audioUrl} title={track.title} artist={track.artist} coverUrl={track.coverUrl} />
                  <ShareButton title={`${track.title} by ${track.artist}`} url={`${typeof window !== "undefined" ? window.location.origin : ""}/track/${track.slug || track.id}`} />
                </div>
              </div>
            </div>

            {/* Mobile queue panel */}
            {showQueue && (
              <div className="absolute right-0 top-0 bottom-0 w-full glass-card border-l border-[var(--glass-border)] flex flex-col z-10 animate-slide-up">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
                  <h3 className="font-bold text-white">Queue</h3>
                  <button onClick={() => setShowQueue(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <X size={18} className="text-white" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {queue.map((t, i) => (
                    <div key={`${t.id}-${i}`} onClick={() => { setQueue(queue, i); setShowQueue(false); }}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${i === currentIndex ? "bg-white/10" : "hover:bg-white/5 active:bg-white/10"}`}>
                      <span className={`text-xs w-6 text-center tabular-nums shrink-0 ${i === currentIndex ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>
                        {i === currentIndex && playing ? <EqBars /> : i + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0">
                        {t.coverUrl && <Image src={t.coverUrl} alt={t.title} width={40} height={40} className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate font-medium ${i === currentIndex ? "text-[var(--primary)]" : "text-white"}`}>{t.title}</p>
                        <p className="text-xs text-[var(--muted)] truncate">{t.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────── DESKTOP PLAYER BAR ───────────────────────── */}
      <div className="hidden lg:block border-t border-[var(--glass-border)] shrink-0" style={{ height: "var(--player-height)" }}>
        <div className="h-full glass-card flex items-center justify-between gap-6 px-6">

          {/* Left: track info */}
          <div className="flex items-center gap-3 w-72 min-w-0 shrink-0">
            <div
              className="relative shrink-0 cursor-pointer group/thumb"
              onClick={() => setShowFullScreen(true)}
            >
              {track.coverUrl ? (
                <Image
                  src={track.coverUrl}
                  alt={track.title}
                  width={54}
                  height={54}
                  className="rounded-lg object-cover shadow-lg group-hover/thumb:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-[54px] h-[54px] rounded-lg bg-[var(--surface-2)]" />
              )}
              {playing && (
                <div className="absolute -bottom-1 -right-1 flex items-end gap-[2px] bg-[var(--background)] rounded-full p-1">
                  {[1,2,3].map((i) => (
                    <span key={i} className="eq-bar" style={{ animationDelay: `${i * 0.15}s`, height: `${4+i*2}px` }} />
                  ))}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={track.slug ? `/track/${track.slug}` : `/track/${track.id}`} className="block group/link">
                <p className="text-sm font-semibold truncate group-hover/link:text-[var(--primary)] transition-colors">{track.title}</p>
                <p className="text-xs text-[var(--muted)] truncate">{track.artist}</p>
              </Link>
            </div>
            <LikeButton trackId={track.id} size={16} />
          </div>

          {/* Center: controls + progress */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
            <div className="flex items-center gap-5">
              <button
                onClick={toggleShuffle}
                className={`transition-all ${shuffle ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-white"}`}
              >
                <Shuffle size={16} />
              </button>
              <button onClick={handlePrev} className="text-[var(--muted)] hover:text-white transition-colors">
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-full bg-white hover:scale-105 active:scale-95 flex items-center justify-center text-black transition-all shadow-lg"
              >
                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={next} className="text-[var(--muted)] hover:text-white transition-colors">
                <SkipForward size={20} fill="currentColor" />
              </button>
              <button
                onClick={cycleRepeat}
                className={`transition-all ${repeat !== "off" ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-white"}`}
              >
                {repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
            </div>
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs text-[var(--muted)] w-9 text-right tabular-nums font-medium">{fmt(progress)}</span>
              <Slider
                value={[progress]}
                max={duration || 1}
                step={0.1}
                onValueChange={([v]: number[]) => { if (audioRef.current) audioRef.current.currentTime = v; }}
                className="flex-1"
              />
              <span className="text-xs text-[var(--muted)] w-9 tabular-nums font-medium">{fmt(duration)}</span>
            </div>
          </div>

          {/* Right: volume + queue */}
          <div className="flex items-center gap-3 w-44 shrink-0 justify-end">
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`transition-all ${showQueue ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-white"}`}
            >
              <List size={17} />
            </button>
            <button onClick={toggleMute} className="text-[var(--muted)] hover:text-white transition-colors">
              {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={([v]: number[]) => setVolume(v)}
              className="w-24"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────── MOBILE MINI PLAYER ───────────────────────── */}
      <div className="lg:hidden fixed left-0 right-0 z-40 px-2 pb-1" style={{ bottom: "calc(68px + env(safe-area-inset-bottom, 0px))" }}>
        <div
          onClick={() => setShowFullScreen(true)}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._touchStartX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchStartX;
            if (startX == null) return;
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) < 50) return;
            e.preventDefault();
            if (dx < 0) next(); else handlePrev();
          }}
          className="glass-card rounded-lg shadow-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        >
          {/* Progress bar */}
          <div className="h-[1.5px] bg-[var(--surface-3)]">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-300"
              style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex items-center gap-2.5 px-2.5 py-1.5">
            <div className="relative shrink-0">
              {track.coverUrl ? (
                <Image src={track.coverUrl} alt={track.title} width={40} height={40} className="rounded-lg object-cover" />
              ) : (
                <div className="w-[40px] h-[40px] rounded-lg bg-[var(--surface-2)]" />
              )}
              {playing && (
                <div className="absolute -bottom-0.5 -right-0.5 flex items-end gap-[2px] bg-[var(--background)] rounded-full p-0.5">
                  {[1,2,3].map((i) => (
                    <span key={i} className="eq-bar" style={{ animationDelay: `${i*0.15}s`, height: `${2+i*1.5}px`, width: "1.5px" }} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{track.title}</p>
              <p className="text-xs text-[var(--muted)] truncate">{track.artist}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="p-1.5 text-[var(--muted)] active:text-white transition-colors">
                <SkipBack size={16} fill="currentColor" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggle(); }}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-md active:scale-95 transition-transform"
              >
                {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="p-1.5 text-[var(--muted)] active:text-white transition-colors">
                <SkipForward size={16} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────── DESKTOP QUEUE PANEL ──────────────────────── */}
      {showQueue && !showFullScreen && (
        <div className="fixed right-4 bottom-28 w-80 h-[440px] glass-card rounded-2xl border border-[var(--glass-border)] shadow-2xl z-50 flex flex-col animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
            <h3 className="font-bold text-sm text-white">Queue</h3>
            <button onClick={() => setShowQueue(false)} className="text-[var(--muted)] hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {queue.map((t, i) => (
              <div
                key={`${t.id}-${i}`}
                onClick={() => setQueue(queue, i)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${i === currentIndex ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <span className={`text-xs w-5 text-center tabular-nums shrink-0 ${i === currentIndex ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>
                  {i + 1}
                </span>
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0">
                  {t.coverUrl ? <Image src={t.coverUrl} alt={t.title} width={36} height={36} className="object-cover" /> : <div className="w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${i === currentIndex ? "text-[var(--primary)]" : "text-white"}`}>{t.title}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{t.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
