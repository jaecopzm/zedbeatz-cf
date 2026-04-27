"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/player-store";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, List, X, ChevronDown, Mic2
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import Link from "next/link";
import LikeButton from "@/components/like-button";
import ShareButton from "@/components/share-button";
import DownloadButton from "@/components/download-button";
import WhatsAppBanner from "@/components/whatsapp-banner";
import LyricsView from "./lyrics-view";
import AudioVisualizer from "@/components/audio-visualizer";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function Player() {
  const { queue, currentIndex, playing, loading, shuffle, repeat, toggle, next, prev, toggleShuffle, cycleRepeat, setQueue, setLoading, reorderQueue } = usePlayer();
  const track = queue[currentIndex];
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const haptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("player-volume");
      return saved ? parseFloat(saved) : 0.8;
    }
    return 0.8;
  });
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [showQueue, setShowQueue]         = useState(false);
  const [showLyrics, setShowLyrics]       = useState(false);
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

  // ─── Soft Fade & Gapless Playback Logic ──────────────────
  useEffect(() => {
    if (!playing || !audioRef.current || duration <= 0) return;
    
    let raf: number;
    const fade = () => {
      if (audioRef.current && !audioRef.current.paused) {
        const currentTime = audioRef.current.currentTime;
        const remaining = duration - currentTime;
        const targetVol = volume; // user's chosen volume
        
        // FADE OUT at the end (last 3 seconds)
        if (remaining <= 3 && remaining > 0) {
          audioRef.current.volume = Math.max(0, targetVol * (remaining / 3));
        } 
        // FADE IN at the beginning (first 1.5 seconds)
        else if (currentTime <= 1.5) {
          audioRef.current.volume = Math.min(targetVol, targetVol * (currentTime / 1.5));
        }
        // NORMAL PLAYBACK
        else {
          audioRef.current.volume = targetVol;
        }
      }
      raf = requestAnimationFrame(fade);
    };
    raf = requestAnimationFrame(fade);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, volume, track]);

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
    haptic();
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      prev();
    }
  }

  // ─── Keyboard Shortcuts ──────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't intercept shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!track) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          toggle();
          break;
        case "ArrowRight":
          if (!e.shiftKey) { e.preventDefault(); next(); }
          break;
        case "ArrowLeft":
          if (!e.shiftKey) { e.preventDefault(); handlePrev(); }
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        case "f":
        case "F":
          setShowFullScreen((v) => !v);
          break;
        case "s":
        case "S":
          toggleShuffle();
          break;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, toggle, next, toggleShuffle]);

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
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setProgress(t);
          // Save last-played state for Continue Listening
          if (track && t > 5) {
            localStorage.setItem('zedbeatz-last-played', JSON.stringify({
              track, currentTime: t, duration: e.currentTarget.duration
            }));
          }
        }}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          // Resume from saved position
          const resume = sessionStorage.getItem('zedbeatz-resume-time');
          if (resume) {
            e.currentTarget.currentTime = parseFloat(resume);
            sessionStorage.removeItem('zedbeatz-resume-time');
          }
        }}
        onEnded={handleEnded}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => setLoading(false)}
        className="hidden"
      />

      {/* ─────────────────── FULL-SCREEN NOW PLAYING ──────────────────── */}
      {showFullScreen && (
        <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-black">
          {/* Dynamic ambient background with color extraction */}
          {track.coverUrl && (
            <div className="absolute inset-0 overflow-hidden z-0">
              <Image src={track.coverUrl} alt="" fill sizes="100vw" className="object-cover opacity-20 blur-[100px] scale-125 animate-pulse" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
            </div>
          )}

          {/* ── DESKTOP: Enhanced two-column layout ── */}
          <div className="hidden lg:flex h-full relative z-10">

            {/* Left column: cover + controls */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 min-w-0">

              {/* Top bar */}
              <div className="w-full max-w-sm flex items-center justify-between mb-4">
                <button onClick={() => setShowFullScreen(false)}
                  className="flex items-center gap-1.5 text-white/60 hover:text-white transition-all group">
                  <ChevronDown size={18} className="group-hover:-translate-y-1 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Now Playing</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowLyrics(!showLyrics)}
                    className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${showLyrics ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                  >
                    <Mic2 size={16} />
                  </button>
                  <DownloadButton audioUrl={track.audioUrl} title={track.title} artist={track.artist} coverUrl={track.coverUrl} />
                  <ShareButton title={`${track.title} by ${track.artist}`} url={`${typeof window !== "undefined" ? window.location.origin : ""}/track/${track.slug || track.id}`} />
                </div>
              </div>

              {/* Cover art or Lyrics */}
              {showLyrics ? (
                <div className="flex-1 w-full max-w-lg min-h-0 relative mb-4 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <LyricsView trackId={track.id} progress={progress} className="absolute inset-0" />
                </div>
              ) : (
                <div className="relative w-full max-w-sm aspect-square mb-4 group">
                  {/* Enhanced glow effect */}
                  <div className={`absolute -inset-8 rounded-full blur-[60px] transition-all duration-1000 pointer-events-none ${playing ? "opacity-50 scale-110" : "opacity-0 scale-100"}`}
                    style={{ background: "radial-gradient(circle, var(--primary) 0%, rgba(30,215,96,0.3) 40%, transparent 70%)" }} />
                  
                  {/* Album art with enhanced shadow */}
                  <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
                    {track.coverUrl ? (
                      <Image src={track.coverUrl} alt={track.title} fill priority unoptimized
                        className={`object-cover transition-all duration-700 ${playing ? "scale-100" : "scale-95"}`} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)]" />
                    )}
                    
                    {/* Enhanced visualizer overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-center px-4 pb-3">
                      <AudioVisualizer
                        audioRef={audioRef}
                        playing={playing}
                        height={40}
                        barCount={32}
                      />
                    </div>
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Track info */}
              <div className="w-full max-w-sm flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1 mr-3">
                  <h1 className="text-lg font-black tracking-tight leading-tight text-white mb-0.5 truncate">{track.title}</h1>
                  <p className="text-xs text-white/60 truncate">
                    <Link href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`}
                      className="hover:text-[var(--primary)] transition-colors font-semibold">
                      {track.artist}
                    </Link>
                    {track.featuredArtists && <span className="text-[11px]"> feat. {track.featuredArtists}</span>}
                  </p>
                </div>
                <div onClick={e => e.stopPropagation()} className="shrink-0">
                  <LikeButton trackId={track.id} size={18} />
                </div>
              </div>

              {/* Enhanced Progress */}
              <div className="w-full max-w-sm mb-4">
                <Slider value={[progress]} max={duration || 1} step={0.1}
                  onValueChange={([v]: number[]) => { if (audioRef.current) audioRef.current.currentTime = v; }}
                  className="mb-1.5" />
                <div className="flex justify-between text-[10px] text-white/50 tabular-nums font-semibold">
                  <span>{fmt(progress)}</span><span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Enhanced Transport */}
              <div className="w-full max-w-sm flex items-center justify-between mb-3">
                <button onClick={() => { haptic(); toggleShuffle(); }}
                  className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${shuffle ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-white/40 hover:text-white hover:bg-white/10"}`}>
                  <Shuffle size={16} />
                </button>
                <button onClick={handlePrev} className="p-1.5 text-white/70 hover:text-white active:scale-90 transition-all hover:scale-110">
                  <SkipBack size={24} fill="currentColor" />
                </button>
                <button onClick={() => { haptic(); toggle(); }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-white to-white/90 flex items-center justify-center text-black shadow-[0_0_30px_rgba(255,255,255,0.3),0_6px_24px_rgba(0,0,0,0.6)] active:scale-95 hover:scale-110 transition-all relative group">
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : playing ? (
                    <Pause size={22} fill="currentColor" />
                  ) : (
                    <Play size={22} fill="currentColor" className="ml-0.5" />
                  )}
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => { haptic(); next(); }} className="p-1.5 text-white/70 hover:text-white active:scale-90 transition-all hover:scale-110">
                  <SkipForward size={24} fill="currentColor" />
                </button>
                <button onClick={cycleRepeat}
                  className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${repeat !== "off" ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-white/40 hover:text-white hover:bg-white/10"}`}>
                  {repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
                </button>
              </div>

              {/* Enhanced Volume */}
              <div className="w-full max-w-sm flex items-center gap-2.5">
                <button onClick={toggleMute} className="text-white/50 hover:text-white transition-all shrink-0 hover:scale-110 active:scale-95">
                  {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <Slider value={[volume]} max={1} step={0.01} onValueChange={([v]: number[]) => setVolume(v)} className="flex-1" />
                <span className="text-[10px] text-white/40 font-semibold tabular-nums w-8 text-right">{Math.round(volume * 100)}%</span>
              </div>
            </div>

            {/* Right column: Enhanced queue */}
            <div className="w-96 shrink-0 flex flex-col border-l border-white/10 bg-black/30 backdrop-blur-xl">
              <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
                    <List size={16} className="text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">Up Next</h3>
                    <p className="text-xs text-white/40">{queue.length} tracks</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {queue.map((t, i) => (
                  <div
                    key={`${t.id}-${i}`}
                    draggable
                    onDragStart={() => { dragIndexRef.current = i; }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={() => {
                      if (dragIndexRef.current !== null && dragIndexRef.current !== i) {
                        reorderQueue(dragIndexRef.current, i);
                      }
                      setDragOverIndex(null);
                      dragIndexRef.current = null;
                    }}
                    onClick={() => setQueue(queue, i)}
                    className={`flex items-center gap-3 px-5 py-3 cursor-grab active:cursor-grabbing transition-all border-l-2 ${
                      dragOverIndex === i ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-transparent'
                    } ${i === currentIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                    <span className={`text-xs w-6 text-center tabular-nums shrink-0 font-bold ${i === currentIndex ? 'text-[var(--primary)]' : 'text-white/40'}`}>
                      {i === currentIndex && playing ? <EqBars /> : i + 1}
                    </span>
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0 shadow-lg">
                      {t.coverUrl && <Image src={t.coverUrl} alt={t.title} width={44} height={44} className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${i === currentIndex ? 'text-[var(--primary)]' : 'text-white'}`}>{t.title}</p>
                      <p className="text-xs text-white/50 truncate">{t.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MOBILE: Enhanced centered layout ── */}
          <div className="lg:hidden flex flex-col h-full">
            {/* Enhanced Header */}
            <div className="relative flex items-center justify-between px-4 py-4 shrink-0 backdrop-blur-xl bg-black/20">
              <button onClick={() => setShowFullScreen(false)} className="p-3 rounded-full hover:bg-white/10 transition-all active:scale-90">
                <ChevronDown size={26} className="text-white" strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_8px_var(--primary)]" />
                <span className="text-xs font-black text-white uppercase tracking-wider">Now Playing</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setShowLyrics(!showLyrics); setShowQueue(false); }}
                  className={`p-3 rounded-full transition-all active:scale-90 ${showLyrics ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-white/70 hover:bg-white/10"}`}
                >
                  <Mic2 size={22} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => { setShowQueue(!showQueue); setShowLyrics(false); }}
                  className={`p-3 rounded-full transition-all active:scale-90 ${showQueue ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-white/70 hover:bg-white/10"}`}
                >
                  <List size={22} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="relative flex-1 flex flex-col items-center px-5 pb-8 gap-4 overflow-hidden" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
              {/* Enhanced Album art or Lyrics */}
              {showLyrics ? (
                <div className="flex-1 w-full relative mt-3 mb-3 min-h-0 rounded-3xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <LyricsView trackId={track.id} progress={progress} className="absolute inset-0" />
                </div>
              ) : (
                <div className="relative w-full max-w-sm aspect-square shrink-0 mt-4 group">
                  <div className={`absolute -inset-8 rounded-full blur-[60px] transition-all duration-700 ${playing ? "opacity-50 scale-110" : "opacity-0 scale-100"}`}
                    style={{ background: "radial-gradient(circle, var(--primary) 0%, rgba(30,215,96,0.4) 40%, transparent 70%)" }} />
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
                    {track.coverUrl ? (
                      <Image src={track.coverUrl} alt={track.title} fill sizes="(max-width: 640px) 100vw, 448px"
                        className={`object-cover transition-all duration-700 ${playing ? "scale-100" : "scale-95"}`} priority unoptimized />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)]" />
                    )}
                    {/* Enhanced visualizer */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-center px-4 pb-3">
                      <AudioVisualizer
                        audioRef={audioRef}
                        playing={playing}
                        height={48}
                        barCount={32}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Enhanced Track info */}
              <div className="w-full max-w-md text-center px-2">
                <h1 className="text-2xl font-black mb-1.5 leading-tight text-white truncate">{track.title}</h1>
                <p className="text-sm text-white/60 font-semibold truncate">
                  <Link href={track.artistSlug ? `/artist/${track.artistSlug}` : `/artist/${track.artistId}`} className="hover:text-[var(--primary)] transition-colors">
                    {track.artist}
                  </Link>
                  {track.featuredArtists && <span className="text-xs"> feat. {track.featuredArtists}</span>}
                </p>
              </div>

              {/* Enhanced Progress */}
              <div className="w-full max-w-md px-2">
                <WhatsAppBanner className="mb-4" />
                <Slider value={[progress]} max={duration || 1} step={0.1}
                  onValueChange={([v]: number[]) => { if (audioRef.current) audioRef.current.currentTime = v; }} className="mb-3" />
                <div className="flex justify-between text-xs text-white/50 tabular-nums font-bold">
                  <span>{fmt(progress)}</span><span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Enhanced Transport */}
              <div className="flex items-center justify-center gap-4 w-full max-w-sm">
                <button onClick={toggleShuffle} className={`p-3 rounded-full transition-all active:scale-90 ${shuffle ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-white/50 hover:text-white hover:bg-white/10"}`}>
                  <Shuffle size={22} />
                </button>
                <button onClick={handlePrev} className="p-2 text-white/80 hover:text-white active:scale-90 transition-all">
                  <SkipBack size={32} fill="currentColor" />
                </button>
                <button onClick={toggle}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-white to-white/90 flex items-center justify-center text-black shadow-[0_0_50px_rgba(255,255,255,0.3),0_10px_40px_rgba(0,0,0,0.5)] active:scale-95 transition-all relative group">
                  {loading ? (
                    <div className="w-8 h-8 border-3 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : playing ? (
                    <Pause size={32} fill="currentColor" />
                  ) : (
                    <Play size={32} fill="currentColor" className="ml-1" />
                  )}
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-active:opacity-100 transition-opacity" />
                </button>
                <button onClick={next} className="p-2 text-white/80 hover:text-white active:scale-90 transition-all">
                  <SkipForward size={32} fill="currentColor" />
                </button>
                <button onClick={cycleRepeat} className={`p-3 rounded-full transition-all active:scale-90 ${repeat !== "off" ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-white/50 hover:text-white hover:bg-white/10"}`}>
                  {repeat === "one" ? <Repeat1 size={22} /> : <Repeat size={22} />}
                </button>
              </div>

              {/* Enhanced Like + Volume + Share + Download */}
              <div className="flex items-center justify-between w-full max-w-md px-2">
                <div onClick={e => e.stopPropagation()}><LikeButton trackId={track.id} size={24} /></div>
                <div className="flex items-center gap-3">
                  <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors active:scale-90">
                    {volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                  </button>
                  <Slider value={[volume]} max={1} step={0.01} onValueChange={([v]: number[]) => setVolume(v)} className="w-28" />
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <DownloadButton audioUrl={track.audioUrl} title={track.title} artist={track.artist} coverUrl={track.coverUrl} />
                  <ShareButton title={`${track.title} by ${track.artist}`} url={`${typeof window !== "undefined" ? window.location.origin : ""}/track/${track.slug || track.id}`} />
                </div>
              </div>
            </div>

            {/* Enhanced Mobile queue panel */}
            {showQueue && (
              <div className="absolute right-0 top-0 bottom-0 w-full bg-black/95 backdrop-blur-2xl border-l border-white/10 flex flex-col z-10 animate-slide-up">
                <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
                      <List size={16} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">Up Next</h3>
                      <p className="text-xs text-white/40">{queue.length} tracks</p>
                    </div>
                  </div>
                  <button onClick={() => setShowQueue(false)} className="p-2 rounded-full hover:bg-white/10 transition-all active:scale-90">
                    <X size={20} className="text-white" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {queue.map((t, i) => (
                    <div key={`${t.id}-${i}`} onClick={() => { setQueue(queue, i); setShowQueue(false); }}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all active:scale-[0.98] ${i === currentIndex ? "bg-white/10" : "hover:bg-white/5 active:bg-white/10"}`}>
                      <span className={`text-xs w-6 text-center tabular-nums shrink-0 font-bold ${i === currentIndex ? "text-[var(--primary)]" : "text-white/40"}`}>
                        {i === currentIndex && playing ? <EqBars /> : i + 1}
                      </span>
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0 shadow-lg">
                        {t.coverUrl && <Image src={t.coverUrl} alt={t.title} width={44} height={44} className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate font-bold ${i === currentIndex ? "text-[var(--primary)]" : "text-white"}`}>{t.title}</p>
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
                className="w-9 h-9 rounded-full bg-white hover:scale-105 active:scale-95 flex items-center justify-center text-black transition-all shadow-lg relative"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : playing ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                )}
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

          {/* Right: volume + queue + lyrics */}
          <div className="flex items-center gap-3 w-48 shrink-0 justify-end">
            <button
              onClick={() => { setShowLyrics(!showLyrics); if (!showFullScreen) setShowFullScreen(true); setShowQueue(false); }}
              className={`transition-all ${showLyrics && showFullScreen ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-white"}`}
              title="Lyrics"
            >
              <Mic2 size={17} />
            </button>
            <button
              onClick={() => { setShowQueue(!showQueue); setShowLyrics(false); }}
              className={`transition-all ${showQueue ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-white"}`}
              title="Queue"
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
            (e.currentTarget as any)._touchStartY = touch.clientY;
          }}
          onTouchEnd={(e) => {
            const el = e.currentTarget as any;
            const startX = el._touchStartX;
            const startY = el._touchStartY;
            if (startX == null || startY == null) return;
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            // Swipe up → open fullscreen
            if (dy < -40 && Math.abs(dy) > Math.abs(dx)) {
              e.preventDefault();
              setShowFullScreen(true);
              return;
            }
            // Swipe left/right → skip tracks
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
              e.preventDefault();
              if (dx < 0) next(); else handlePrev();
            }
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
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-md active:scale-95 transition-transform relative"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : playing ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                )}
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
                draggable
                onDragStart={() => { dragIndexRef.current = i; }}
                onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={() => {
                  if (dragIndexRef.current !== null && dragIndexRef.current !== i) {
                    reorderQueue(dragIndexRef.current, i);
                  }
                  setDragOverIndex(null);
                  dragIndexRef.current = null;
                }}
                onClick={() => setQueue(queue, i)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-grab active:cursor-grabbing transition-all border-t-2 ${
                  dragOverIndex === i ? 'border-[var(--primary)]' : 'border-transparent'
                } ${i === currentIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <span className={`text-xs w-5 text-center tabular-nums shrink-0 ${i === currentIndex ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
                  {i + 1}
                </span>
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0">
                  {t.coverUrl ? <Image src={t.coverUrl} alt={t.title} width={36} height={36} className="object-cover" /> : <div className="w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${i === currentIndex ? 'text-[var(--primary)]' : 'text-white'}`}>{t.title}</p>
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
