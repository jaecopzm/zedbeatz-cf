"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import ScrollRow from "@/components/home/scroll-row";
import { useUser } from "@clerk/nextjs";

export default function ReleaseRadar() {
  const { isSignedIn, isLoaded } = useUser();
  const { queue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setLoading(false); return; }

    fetch("/api/follows/releases")
      .then((r) => r.json())
      .then((d) => { setTracks(d.tracks ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isSignedIn, isLoaded]);

  if (!isLoaded || loading) return null;
  if (!isSignedIn || tracks.length === 0) return null;

  return (
    <section className="mb-8 md:mb-10">
      <div className="px-4 md:px-8 mb-3 md:mb-4 flex items-center gap-2">
        <h2 className="text-xl md:text-[26px] font-black tracking-tight">Release Radar</h2>
        <span className="px-2 py-0.5 bg-[var(--glass-hover)] text-[10px] font-bold text-foreground/60 rounded">
          {tracks.length}
        </span>
      </div>
      <ScrollRow>
        {tracks.map((t, i) => {
          const isActive = queue[currentIndex]?.id === t.id;
          return (
            <div key={t.id} className="flex-shrink-0 w-[140px] md:w-[176px] snap-start">
              <div
                onClick={() => isActive ? toggle() : setQueue(tracks, i)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden mb-1.5 md:mb-2.5 bg-[var(--surface-2)] transition-all duration-200 rounded-lg">
                  {t.coverUrl && (
                    <Image src={t.coverUrl} alt={t.title} fill loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                  )}
                  <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-xl shadow-[var(--primary-glow)] scale-90 group-hover:scale-100 transition-transform duration-200">
                      {isActive && playing ? (
                        <Pause size={14} className="text-black fill-black md:w-5 md:h-5" />
                      ) : (
                        <Play size={14} className="text-black fill-black ml-0.5 md:w-5 md:h-5" />
                      )}
                    </div>
                  </div>
                </div>
                <p className={`text-[10px] md:text-sm font-semibold truncate ${isActive ? "text-[var(--primary)]" : "text-foreground"}`}>{t.title}</p>
                <p className="text-[9px] md:text-xs text-[var(--muted)] truncate">{t.artist}</p>
              </div>
            </div>
          );
        })}
      </ScrollRow>
    </section>
  );
}
