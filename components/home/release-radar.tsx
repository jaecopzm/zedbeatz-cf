"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Radio, UserPlus } from "lucide-react";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";
import ScrollRow from "@/components/home/scroll-row";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";

export default function ReleaseRadar() {
  const { isSignedIn, isLoaded } = useUser();
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
    <section className="mb-10 md:mb-14">
      <div className="px-4 md:px-8 mb-5 flex items-center gap-2">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">Release Radar</h2>
        <span className="px-2 py-0.5 bg-white/10 text-[10px] font-bold text-white/60">
          {tracks.length}
        </span>
      </div>
      <ScrollRow>
        {tracks.map((t) => (
          <div key={t.id} className="flex-shrink-0 w-[140px] md:w-[176px] snap-start">
            <TrackCard track={t} queue={tracks} bare />
          </div>
        ))}
      </ScrollRow>
    </section>
  );
}
