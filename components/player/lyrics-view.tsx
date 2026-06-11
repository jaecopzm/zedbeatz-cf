"use client";

import { useEffect, useRef, useState } from "react";
import { Mic2 } from "lucide-react";

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsData {
  lyrics?: string;
  synced_lyrics?: string;
  has_lyrics: boolean;
}

interface LyricsViewProps {
  trackId: number;
  progress: number;
  className?: string;
}

export default function LyricsView({ trackId, progress, className = "" }: LyricsViewProps) {
  const [data, setData] = useState<LyricsData | null>(null);
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    
    async function fetchLyrics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tracks/${trackId}/lyrics`);
        if (!res.ok) throw new Error("Failed to fetch lyrics");
        const json = await res.json();
        
        if (mounted) {
          setData(json);
          if (json.synced_lyrics) {
            setLines(parseLRC(json.synced_lyrics));
          } else if (json.lyrics) {
            // Fallback for non-synced lyrics
            setLines(json.lyrics.split('\n').map((text: string) => ({ time: -1, text })));
          } else {
            setLines([]);
          }
        }
      } catch (err) {
        console.error("Lyrics fetch error:", err);
        if (mounted) {
          setData({ has_lyrics: false });
          setLines([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLyrics();
    return () => { mounted = false; };
  }, [trackId]);

  // Find active line
  let activeIndex = -1;
  if (lines.length > 0 && lines[0].time !== -1) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (progress >= lines[i].time) {
        activeIndex = i;
        break;
      }
    }
  }

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-foreground/50 ${className}`}>
        <div className="w-6 h-6 border-2 border-[var(--border-strong)] border-t-white/80 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading lyrics...</p>
      </div>
    );
  }

  if (!data?.has_lyrics || lines.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-foreground/40 px-6 text-center ${className}`}>
        <Mic2 size={48} strokeWidth={1} className="mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-foreground/70 mb-2">No Lyrics Available</h3>
        <p className="text-sm">We don't have lyrics for this track yet.</p>
      </div>
    );
  }

  const isSynced = lines[0]?.time !== -1;

  return (
    <div 
      ref={containerRef}
      className={`relative h-full overflow-y-auto px-4 lg:px-12 py-[30vh] select-none scrollbar-hide ${className}`}
      style={{ scrollBehavior: 'smooth', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}
    >
      <div className="flex flex-col gap-6 lg:gap-8 max-w-2xl mx-auto pb-[20vh]">
        {lines.map((line, i) => {
          const isActive = isSynced ? i === activeIndex : false;
          const isPast = isSynced ? i < activeIndex : false;
          
          // Handle empty lines or instrumental breaks gracefully
          if (!line.text.trim()) return <div key={i} className="h-4" />;
          
          return (
            <div 
              key={i} 
              ref={isActive ? activeLineRef : null}
              className={`transition-all duration-500 ease-out origin-left ${
                isSynced 
                  ? isActive 
                    ? "text-foreground text-3xl lg:text-4xl font-black scale-100 opacity-100 drop-shadow-lg" 
                    : isPast
                      ? "text-foreground text-3xl lg:text-4xl font-bold opacity-30 scale-95"
                      : "text-foreground text-3xl lg:text-4xl font-bold opacity-50 scale-95 hover:opacity-70 transition-opacity"
                  : "text-foreground/80 text-2xl lg:text-3xl font-bold mb-2" // Non-synced style
              }`}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Parse LRC format: [MM:SS.xx] text
function parseLRC(lrc: string): LyricLine[] {
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const line of lines) {
    const match = regex.exec(line);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      let ms = parseInt(match[3], 10);
      // Handle both 2-digit (centiseconds) and 3-digit (milliseconds) LRC formats
      if (match[3].length === 2) ms *= 10; 
      
      const timeInSeconds = min * 60 + sec + ms / 1000;
      const text = match[4].trim();
      
      result.push({ time: timeInSeconds, text });
    }
  }

  // Sort by time just in case
  return result.sort((a, b) => a.time - b.time);
}
