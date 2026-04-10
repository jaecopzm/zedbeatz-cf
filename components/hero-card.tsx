"use client";

import { Play, Pause } from "lucide-react";
import Image from "next/image";
import { usePlayer, type Track } from "@/lib/player-store";

export default function HeroCard({ 
  track, 
  queue, 
  large = false 
}: { 
  track: Track; 
  queue: Track[]; 
  large?: boolean 
}) {
  const { queue: pQueue, currentIndex, playing, setQueue, toggle } = usePlayer();
  const isActive = pQueue[currentIndex]?.id === track.id;

  function handlePlay() {
    if (isActive) {
      toggle();
      return;
    }
    const idx = queue.findIndex((t) => t.id === track.id);
    setQueue(queue, idx >= 0 ? idx : 0);
  }

  return (
    <div 
      onClick={handlePlay}
      className={`relative group cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 ${large ? 'h-80' : 'h-40'}`}
    >
      {track.coverUrl ? (
        <Image 
          src={track.coverUrl} 
          alt={track.title} 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-105" 
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface)] to-[var(--background)]" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`font-bold ${large ? 'text-3xl mb-2' : 'text-xl'} text-white truncate leading-tight`}>
            {track.title}
          </p>
          <p className={`text-white/80 ${large ? 'text-base' : 'text-sm'} truncate`}>{track.artist}</p>
        </div>
        
        <div className={`flex-shrink-0 w-14 h-14 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-[var(--primary-hover)] active:scale-95 ${isActive && playing ? 'scale-100 opacity-100' : 'scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`}>
          {isActive && playing ? (
            <Pause className="text-black fill-black" size={26} />
          ) : (
            <Play className="text-black fill-black ml-1" size={26} />
          )}
        </div>
      </div>

      {isActive && playing && (
        <div className="absolute top-4 right-4">
           <div className="flex items-end gap-1 h-5">
              <span className="w-1 bg-[var(--primary)] animate-bounce h-2 rounded-full" />
              <span className="w-1 bg-[var(--primary)] animate-bounce h-5 rounded-full" style={{ animationDelay: "0.15s" }} />
              <span className="w-1 bg-[var(--primary)] animate-bounce h-3 rounded-full" style={{ animationDelay: "0.3s" }} />
            </div>
        </div>
      )}
    </div>
  );
}
