'use client';

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
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
      <div className="col-span-full text-center py-8 text-[var(--muted)] text-sm">
        Sign in to see your recently played tracks
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="col-span-full text-center py-8 text-[var(--muted)] text-sm">
        No recently played tracks yet
      </div>
    );
  }

  return (
    <>
      {tracks.slice(0, 12).map((t) => (
        <TrackCard key={t.id} track={t} queue={tracks} />
      ))}
    </>
  );
}
