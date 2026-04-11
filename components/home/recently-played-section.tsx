'use client';

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Clock } from "lucide-react";
import TrackCard from "@/components/track-card";
import TrackCardSkeleton from "@/components/track-card-skeleton";
import type { Track } from "@/lib/player-store";

export default function RecentlyPlayedSection() {
  const { isSignedIn, isLoaded } = useUser();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) { 
      setLoading(false); 
      setTracks([]);
      return; 
    }
    
    setLoading(true);
    fetch("/api/recently-played/list")
      .then(r => r.json())
      .then(data => setTracks(Array.isArray(data.tracks) ? data.tracks : []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, [isSignedIn, isLoaded]);

  // Don't show anything while checking auth
  if (!isLoaded) {
    return null;
  }

  if (loading) {
    return (
      <>
        {Array.from({ length: 6 }).map((_, i) => <TrackCardSkeleton key={i} />)}
      </>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4">
          <Clock size={28} className="text-[var(--muted)]" />
        </div>
        <p className="text-sm font-semibold mb-1">Sign in to track your history</p>
        <p className="text-xs text-[var(--muted)]">See your recently played tracks here</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4">
          <Clock size={28} className="text-[var(--muted)]" />
        </div>
        <p className="text-sm font-semibold mb-1">No tracks played yet</p>
        <p className="text-xs text-[var(--muted)]">Start listening to build your history</p>
      </div>
    );
  }

  return (
    <>
      {tracks.slice(0, 6).map((t) => (
        <TrackCard key={t.id} track={t} queue={tracks} />
      ))}
    </>
  );
}
