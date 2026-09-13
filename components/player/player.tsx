"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { usePlayer } from "@/lib/player-store";
import { useTheme } from "@/components/theme-provider";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Maximize2,
  Shuffle, Repeat, Repeat1, List, X, ChevronDown, Mic2
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import Link from "next/link";
import LikeButton from "@/components/like-button";
import AddToPlaylist from "@/components/add-to-playlist";
import ShareButton from "@/components/share-button";
import DownloadButton from "@/components/download-button";
import WhatsAppBanner from "@/components/whatsapp-banner";
import LyricsView from "./lyrics-view";
import AudioVisualizer from "@/components/audio-visualizer";
import { useAudioAnalyser } from "@/lib/use-audio-analyser";
import MobileMiniplayer from "./mobile-miniplayer";
import MobileNowPlaying from "./mobile-now-playing";
import { TrackMenu } from "@/components/track-menu";
import { encodeId } from "@/lib/hashids";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function Player() {
  const { queue, currentIndex, playing, loading, shuffle, repeat, toggle, next, prev, toggleShuffle, cycleRepeat, setQueue, setLoading, reorderQueue, context } = usePlayer();
  const track = queue[currentIndex];
  const audioRef = useRef<HTMLAudioElement>(null);
  const { gainNode, frequencyData } = useAudioAnalyser(audioRef, playing, 32);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverTimeX, setHoverTimeX] = useState(0);
  const [showRemainingTime, setShowRemainingTime] = useState(false);

  const haptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };
  const [volume, setVolume] = useState(0.8);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [showQueue, setShowQueue]         = useState(false);
  const [showLyrics, setShowLyrics]       = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const { theme } = useTheme();
  const isLight = useMemo(() => theme === "light", [theme]);
  const playedTracksRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("player-volume");
    if (!saved) return;
    const parsed = Number(saved);
    if (Number.isFinite(parsed)) setVolume(Math.min(1, Math.max(0, parsed)));
  }, []);

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
    if (!a || !track?.id) return;
    function handlePlay() {
      if (!playedTracksRef.current.has(track.id)) {
        playedTracksRef.current.add(track.id);
        fetch("/api/tracks/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: track.id }) }).catch(() => {});
        fetch("/api/recently-played", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track_id: track.id }) }).catch(() => {});
      }
    }
    a.addEventListener("play", handlePlay);
    return () => a.removeEventListener("play", handlePlay);
  }, [track]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (!track || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${track.title} | ZedBeatz`,
      artist: track.featuredArtists ? `${track.artist} feat. ${track.featuredArtists}` : track.artist,
      album: "ZedBeatz",
      artwork: track.coverUrl
        ? [{ src: track.coverUrl, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [track, playing]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => toggle());
    navigator.mediaSession.setActionHandler("pause", () => toggle());
    navigator.mediaSession.setActionHandler("nexttrack", () => next());
    navigator.mediaSession.setActionHandler("previoustrack", () => prev());
    navigator.mediaSession.setActionHandler("seekforward", () => {
      if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration);
    });
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      if (audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    });
  }, [toggle, next, prev]);

  useEffect(() => {
    // Set initial volume on audio element (will be overridden by GainNode if Web Audio is active)
    if (audioRef.current && !gainNode) audioRef.current.volume = volume;
    if (typeof window !== "undefined") localStorage.setItem("player-volume", volume.toString());
  }, [volume, gainNode]);

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

  // Keep gain stable. The previous single-element "crossfade" logic caused
  // audible glitches because it continuously manipulated the active stream gain.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !gainNode) return;

    const audioContext = gainNode.context;
    const now = audioContext.currentTime;
    const targetGain = playing && !audio.paused ? volume : 0;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.setTargetAtTime(targetGain, now, 0.02);

    return () => {
      gainNode.gain.cancelScheduledValues(audioContext.currentTime);
    };
  }, [playing, volume, gainNode]);

  function handleEnded() {
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

  // Keyboard Shortcuts
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

  /* ==================== Shared UI pieces ==================== */

  return (
    <>
      {/* Audio element */}
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

      {/* ==================== FULL-SCREEN NOW PLAYING ==================== */}
      {showFullScreen && (
        <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden lg:bg-background">
          {/* Dynamic ambient background with color extraction */}
          {track.coverUrl && (
            <div className="absolute inset-0 overflow-hidden z-0">
              <Image src={track.coverUrl} alt="" fill sizes="100vw" className="object-cover opacity-20 blur-[100px] scale-125 animate-pulse" unoptimized />
              <div className="absolute inset-0" style={{ background: isLight
                ? "linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.7) 50%, var(--background) 100%)"
                : "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 50%, #000 100%)"
              }} />
            </div>
          )}

          {/* DESKTOP: Enhanced layout matching mobile */}
          <div className="hidden lg:flex h-full relative z-10">

            {/* Main content area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 min-w-0 max-w-2xl mx-auto">

              {/* Top bar */}
              <div className="w-full max-w-lg flex items-center justify-between mb-4">
                <button onClick={() => setShowFullScreen(false)}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-90 bg-[var(--glass-hover)] hover:bg-[var(--surface-2)]">
                  <ChevronDown size={20} className="text-foreground" />
                </button>
                
                <div className="flex flex-col items-center gap-0.5 cursor-default">
                  <span className="text-[10px] font-semibold text-foreground/55 uppercase tracking-[0.15em]">
                    {context ? `Playing from ${context.label}` : "Now Playing"}
                  </span>
                  <div className="w-7 h-0.5 rounded-full bg-[var(--surface-2)]" />
                </div>

                <div className="flex items-center justify-center w-9 h-9">
                  <TrackMenu track={track} />
                </div>
              </div>

              {/* Cover art or Lyrics */}
              <div className="w-full max-w-[340px] aspect-square mb-4">
                {showLyrics ? (
                  <div className="w-full h-full rounded-xl overflow-hidden bg-background/40 backdrop-blur-xl border border-[var(--border)] shadow-2xl">
                    <LyricsView trackId={track.id} progress={progress} className="w-full h-full" />
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.7)] ring-1 ring-[var(--border)]"
                      style={{
                        transform: playing ? "scale(1)" : "scale(0.93)",
                        transition: "transform 0.3s ease",
                      }}>
                      {track.coverUrl ? (
                        <Image src={track.coverUrl} alt={track.title} fill priority unoptimized className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#111]" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Track info + Like */}
              <div className="w-full max-w-lg flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1 mr-3">
                  <h1 className="text-xl font-black tracking-tight leading-tight text-foreground mb-0.5 truncate">{track.title}</h1>
                  <p className="text-sm text-foreground/60 truncate">
                    <Link href={track.artistId ? `/artist/${encodeId(track.artistId)}` : "/browse"}
                      className="hover:text-[var(--primary)] transition-colors font-semibold">
                      {track.artist}
                    </Link>
                    {track.featuredArtists && <span className="text-xs"> feat. {track.featuredArtists}</span>}
                  </p>
                </div>
                <div onClick={e => e.stopPropagation()} className="shrink-0">
                  <LikeButton trackId={track.id} size={22} />
                </div>
              </div>

              {/* Progress */}
              <div className="w-full max-w-lg mb-4">
                <Slider value={[progress]} max={duration || 1} step={0.1}
                  onValueChange={([v]: number[]) => { if (audioRef.current) audioRef.current.currentTime = v; }}
                  className="mb-1.5" />
                <div className="flex justify-between text-[11px] text-foreground/50 tabular-nums font-semibold">
                  <span>{fmt(progress)}</span><span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Transport controls */}
              <div className="w-full max-w-lg flex items-center justify-center gap-3 mb-4">
                <button onClick={() => { haptic(); toggleShuffle(); }}
                  className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${shuffle ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-foreground/40 hover:text-foreground hover:bg-[var(--glass-hover)]"}`}>
                  <Shuffle size={17} />
                </button>
                <button onClick={handlePrev} className="p-1.5 text-foreground/70 hover:text-foreground active:scale-90 transition-all hover:scale-110">
                  <SkipBack size={26} fill="currentColor" />
                </button>
                <button onClick={() => { haptic(); toggle(); }}
                  className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black shadow-[0_6px_24px_rgba(0,0,0,0.6)] active:scale-95 hover:scale-105 transition-all relative">
                  {playing ? (
                    <Pause size={22} fill="currentColor" />
                  ) : (
                    <Play size={22} fill="currentColor" className="ml-0.5" />
                  )}
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-3)] rounded-full backdrop-blur-sm">
                      <div className="w-5 h-5 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                    </div>
                  )}
                </button>
                <button onClick={() => { haptic(); next(); }} className="p-1.5 text-foreground/70 hover:text-foreground active:scale-90 transition-all hover:scale-110">
                  <SkipForward size={26} fill="currentColor" />
                </button>
                <button onClick={cycleRepeat}
                  className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${repeat !== "off" ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-foreground/40 hover:text-foreground hover:bg-[var(--glass-hover)]"}`}>
                  {repeat === "one" ? <Repeat1 size={17} /> : <Repeat size={17} />}
                </button>
              </div>

              {/* Secondary actions bar */}
              <div className="w-full max-w-lg flex items-center justify-between px-1">
                {/* Volume */}
                <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                  <button onClick={toggleMute} className="text-foreground/45 hover:text-foreground transition-all shrink-0 hover:scale-110 active:scale-95">
                    {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>
                  <Slider value={[volume]} max={1} step={0.01} onValueChange={([v]: number[]) => setVolume(v)} className="flex-1" />
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowQueue(!showQueue)}
                    className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${showQueue ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-foreground/60 hover:text-foreground hover:bg-[var(--glass-hover)]"}`}>
                    <List size={17} />
                  </button>
                  <button
                    onClick={() => setShowLyrics(!showLyrics)}
                    className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${showLyrics ? "text-[var(--primary)] bg-[var(--primary)]/20" : "text-foreground/60 hover:text-foreground hover:bg-[var(--glass-hover)]"}`}>
                    <Mic2 size={17} />
                  </button>
                  <DownloadButton audioUrl={track.audioUrl} title={track.title} artist={track.artist} featuredArtists={track.featuredArtists} coverUrl={track.coverUrl} />
                  <ShareButton title={`${track.title} by ${track.artist}`} url={`${typeof window !== "undefined" ? window.location.origin : ""}/track/${encodeId(track.id)}`} />
                </div>
              </div>
            </div>

            {/* Queue sidebar (floating) */}
            {showQueue && (
              <div className="fixed right-4 bottom-28 w-80 h-[440px] glass-card rounded-2xl border border-[var(--glass-border)] shadow-2xl z-50 flex flex-col animate-scale-in overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
                      <List size={16} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-foreground">Up Next</h3>
                      <p className="text-xs text-foreground/40">{queue.length} tracks</p>
                    </div>
                  </div>
                  <button onClick={() => setShowQueue(false)} className="p-1.5 rounded-full hover:bg-[var(--glass-hover)] transition-colors">
                    <X size={18} className="text-foreground/60" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {queue.map((t, i) => (
                    <div
                      key={`${t.id}-${i}`}
                      onClick={() => setQueue(queue, i)}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all ${
                        i === currentIndex ? 'bg-[var(--glass-hover)]' : 'hover:bg-[var(--glass-hover)]'
                      }`}>
                      <span className={`text-xs w-5 text-center tabular-nums shrink-0 font-bold ${i === currentIndex ? 'text-[var(--primary)]' : 'text-foreground/40'}`}>
                        {i + 1}
                      </span>
                      <div className="w-10 h-10 rounded overflow-hidden bg-[var(--surface-2)] shrink-0">
                        {t.coverUrl && <Image src={t.coverUrl} alt={t.title} width={40} height={40} className="object-cover" unoptimized />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${i === currentIndex ? 'text-[var(--primary)]' : 'text-foreground'}`}>{t.title}</p>
                        <p className="text-xs text-foreground/50 truncate">{t.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MOBILE: Scrollable Spotify-style layout */}
          <div className="lg:hidden h-full">
          <MobileNowPlaying
            track={track}
            queue={queue}
            currentIndex={currentIndex}
            playing={playing}
            loading={loading}
            shuffle={shuffle}
            repeat={repeat}
            volume={volume}
            progress={progress}
            duration={duration}
            frequencyData={frequencyData}
            showLyrics={showLyrics}
            showQueue={showQueue}
            context={context}
            onClose={() => setShowFullScreen(false)}
            onToggle={toggle}
            onNext={next}
            onPrev={handlePrev}
            onToggleShuffle={toggleShuffle}
            onCycleRepeat={cycleRepeat}
            onToggleMute={toggleMute}
            onVolumeChange={setVolume}
            onProgressChange={(v) => { if (audioRef.current) audioRef.current.currentTime = v; }}
            onToggleLyrics={() => { setShowLyrics(!showLyrics); setShowQueue(false); }}
            onToggleQueue={() => { setShowQueue(!showQueue); setShowLyrics(false); }}
            onSelectTrack={(index) => setQueue(queue, index)}
          />
          </div>
        </div>
      )}

      {/* ==================== DESKTOP PLAYER BAR ==================== */}
      <div className="hidden lg:block border-t border-[var(--glass-border)] shrink-0" style={{ height: "var(--player-height)" }}>
        <div className="h-full bg-background flex items-center justify-between gap-6 px-6">

          {/* ── LEFT: Track info ──────────────────────────────────── */}
          <div className="flex items-center gap-3 w-[280px] min-w-0 shrink-0">
            {/* Album art — rounded, hover expand overlay */}
            <div
              className="relative shrink-0 cursor-pointer group/thumb rounded-md overflow-hidden shadow-lg"
              style={{ width: 56, height: 56 }}
              onClick={() => setShowFullScreen(true)}
            >
              {track.coverUrl ? (
                <Image
                  src={track.coverUrl}
                  alt={track.title}
                  width={56}
                  height={56}
                  className="object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-[var(--surface-2)]" />
              )}
              <div className="absolute inset-0 bg-background/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 size={14} className="text-foreground drop-shadow" />
              </div>
              {playing && (
                <div className="absolute bottom-1 right-1 flex items-end gap-[2px]">
                  {[0,1,2].map((i) => (
                    <span key={i} className="eq-bar eq-bar--active" style={{ animationDelay: `${i * 0.2}s`, height: `${5+i*3}px` }} />
                  ))}
                </div>
              )}
            </div>

            {/* Title + artist + context */}
            <div className="min-w-0 flex-1">
              <Link href={`/track/${encodeId(track.id)}`} className="block group/link">
                <p className="text-sm font-semibold truncate group-hover/link:text-[var(--primary)] transition-colors leading-tight">{track.title}</p>
                <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                  {track.artist}
                  {track.featuredArtists && <span className="text-foreground/30"> ft. {track.featuredArtists}</span>}
                </p>
              </Link>
              {context && (
                <p className="text-[10px] text-foreground/25 truncate mt-0.5 leading-none">
                  {context.href
                    ? <Link href={context.href} className="hover:text-foreground/60 transition-colors">{context.label}</Link>
                    : context.label}
                </p>
              )}
            </div>

            {/* Like + Add to playlist */}
            <div className="flex items-center gap-0.5 shrink-0">
              <LikeButton trackId={track.id} size={16} />
              <AddToPlaylist trackId={track.id} />
            </div>
          </div>

          {/* ── CENTER: Controls + Progress ───────────────────────── */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[680px]">
            {/* Transport buttons */}
            <div className="flex items-center gap-4">
              {/* Shuffle with active dot */}
              <div className="relative flex flex-col items-center">
                <button
                  onClick={toggleShuffle}
                  className={`p-1.5 rounded transition-all hover:scale-110 active:scale-95 ${shuffle ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-foreground"}`}
                  title="Shuffle"
                >
                  <Shuffle size={16} />
                </button>
                {shuffle && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--primary)]" />}
              </div>

              <button onClick={handlePrev} className="p-1 text-[var(--muted)] hover:text-foreground hover:scale-110 active:scale-95 transition-all">
                <SkipBack size={20} fill="currentColor" />
              </button>

              {/* Play / Pause — larger, bolder shadow */}
              <button
                onClick={toggle}
                className="w-10 h-10 rounded-full bg-white hover:scale-105 active:scale-95 flex items-center justify-center text-black transition-all shadow-[0_4px_20px_rgba(0,0,0,0.55)] relative shrink-0"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : playing ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button onClick={next} className="p-1 text-[var(--muted)] hover:text-foreground hover:scale-110 active:scale-95 transition-all">
                <SkipForward size={20} fill="currentColor" />
              </button>

              {/* Repeat with active dot */}
              <div className="relative flex flex-col items-center">
                <button
                  onClick={cycleRepeat}
                  className={`p-1.5 rounded transition-all hover:scale-110 active:scale-95 ${repeat !== "off" ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-foreground"}`}
                  title={repeat === "off" ? "Repeat off" : repeat === "all" ? "Repeat all" : "Repeat one"}
                >
                  {repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
                </button>
                {repeat !== "off" && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--primary)]" />}
              </div>
            </div>

            {/* Progress row with hover timestamp tooltip */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-[11px] text-[var(--muted)] w-9 text-right tabular-nums font-medium select-none shrink-0">
                {fmt(progress)}
              </span>

              {/* Slider wrapper — captures hover for tooltip */}
              <div
                ref={progressBarRef}
                className="flex-1 relative group/prog"
                onMouseMove={(e) => {
                  if (!progressBarRef.current) return;
                  const rect = progressBarRef.current.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                  setHoverTime((x / rect.width) * (duration || 1));
                  setHoverTimeX(x);
                }}
                onMouseLeave={() => setHoverTime(null)}
              >
                {hoverTime !== null && (
                  <div
                    className="absolute -top-7 -translate-x-1/2 bg-[var(--surface-3)] text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap"
                    style={{ left: hoverTimeX }}
                  >
                    {fmt(hoverTime)}
                  </div>
                )}
                <Slider
                  value={[progress]}
                  max={duration || 1}
                  step={0.1}
                  onValueChange={([v]: number[]) => { if (audioRef.current) audioRef.current.currentTime = v; }}
                />
              </div>

              {/* Right timestamp — click to toggle remaining/total */}
              <button
                onClick={() => setShowRemainingTime((r) => !r)}
                className="text-[11px] text-[var(--muted)] hover:text-foreground w-9 tabular-nums font-medium text-left select-none shrink-0 transition-colors"
                title={showRemainingTime ? "Show total duration" : "Show remaining time"}
              >
                {showRemainingTime ? `-${fmt(Math.max(0, duration - progress))}` : fmt(duration)}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Actions + Volume ────────────────────────────── */}
          <div className="flex items-center gap-1 w-[220px] shrink-0 justify-end">
            {/* Lyrics */}
            <button
              onClick={() => { setShowLyrics(!showLyrics); if (!showFullScreen) setShowFullScreen(true); setShowQueue(false); }}
              className={`p-2 rounded transition-all hover:scale-110 active:scale-95 ${showLyrics && showFullScreen ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-foreground"}`}
              title="Lyrics"
            >
              <Mic2 size={16} />
            </button>

            {/* Queue */}
            <button
              onClick={() => { setShowQueue(!showQueue); setShowLyrics(false); }}
              className={`p-2 rounded transition-all hover:scale-110 active:scale-95 ${showQueue ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-foreground"}`}
              title="Queue"
            >
              <List size={16} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setShowFullScreen(true)}
              className="p-2 rounded text-[var(--muted)] hover:text-foreground hover:scale-110 active:scale-95 transition-all"
              title="Full screen (F)"
            >
              <Maximize2 size={16} />
            </button>

            {/* Volume — 3-state icon + slider */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={toggleMute}
                className="p-1 text-[var(--muted)] hover:text-foreground transition-all hover:scale-110 active:scale-95 shrink-0"
                title={volume === 0 ? "Unmute" : "Mute"}
              >
                {volume === 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
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
      </div>

      {/* ==================== MOBILE MINI PLAYER ==================== */}
      <MobileMiniplayer
        onOpenFullscreen={() => setShowFullScreen(true)}
        progress={progress}
        duration={duration}
      />

      {/* ==================== DESKTOP QUEUE PANEL ==================== */}
      {showQueue && !showFullScreen && (
        <div className="fixed right-4 bottom-28 w-80 h-[440px] glass-card rounded-2xl border border-[var(--glass-border)] shadow-2xl z-50 flex flex-col animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
            <h3 className="font-bold text-sm text-foreground">Queue</h3>
            <button onClick={() => setShowQueue(false)} className="text-[var(--muted)] hover:text-foreground transition-colors p-1">
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
                } ${i === currentIndex ? 'bg-[var(--glass-hover)]' : 'hover:bg-[var(--glass-hover)]'}`}
              >
                <span className={`text-xs w-5 text-center tabular-nums shrink-0 ${i === currentIndex ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
                  {i + 1}
                </span>
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0">
                  {t.coverUrl ? <Image src={t.coverUrl} alt={t.title} width={36} height={36} className="object-cover" /> : <div className="w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${i === currentIndex ? 'text-[var(--primary)]' : 'text-foreground'}`}>{t.title}</p>
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