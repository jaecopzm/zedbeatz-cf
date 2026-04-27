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

  if (!isSignedIn) {
    return (
      <div className="px-4 md:px-8 mb-10 md:mb-14">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#FF4500] to-[#FF8C00] shrink-0" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            Release Radar <Radio size={20} className="text-[#FF4500]" />
          </h2>
        </div>
        <div className="flex items-center gap-4 p-4 bg-[var(--surface-2)] rounded-2xl border border-[var(--glass-border)]">
          <UserPlus className="text-[var(--primary)] shrink-0" size={28} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white mb-0.5">Follow artists to get your Release Radar</p>
            <p className="text-xs text-[var(--muted)]">Sign in and follow your favourite artists to see their latest drops here.</p>
          </div>
          <SignInButton mode="modal">
            <button className="shrink-0 px-4 py-2 bg-[var(--primary)] text-black text-xs font-bold rounded-full hover:opacity-90 transition-opacity">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="px-4 md:px-8 mb-10 md:mb-14">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#FF4500] to-[#FF8C00] shrink-0" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            Release Radar
          </h2>
        </div>
        <div className="flex items-center gap-4 p-4 bg-[var(--surface-2)] rounded-2xl border border-[var(--glass-border)]">
          <Radio className="text-[#FF4500] shrink-0" size={28} />
          <div>
            <p className="text-sm font-semibold text-white mb-0.5">No releases yet</p>
            <p className="text-xs text-[var(--muted)]">
              Follow artists on their pages to see their latest releases here.{" "}
              <Link href="/browse" className="text-[var(--primary)] hover:underline">Browse artists →</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mb-10 md:mb-14">
      <div className="px-4 md:px-8 mb-5 flex items-center gap-3">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#FF4500] to-[#FF8C00] shrink-0" />
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Release Radar</h2>
        <span className="px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[11px] font-semibold text-[var(--muted)]">
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
