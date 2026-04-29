"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Clock, Disc3, Headphones, PlayCircle, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import TrackRow from "@/components/track-row";
import { ChartContainer } from "@/components/ui/chart";
import { useUser, SignInButton } from "@clerk/nextjs";
import type { Track } from "@/lib/player-store";

type StatsTrack = Track & { plays: number };
type TopArtist = { id: number; name: string; slug?: string; imageUrl?: string | null; plays: number };
type StatsResponse = {
  totalListeningTime: number; totalPlays: number;
  topTracks: StatsTrack[]; topArtists: TopArtist[];
  playedTracks: { id: number; audioUrl: string; duration?: number; plays: number }[];
};

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function StatCard({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub: string; color: string; icon: React.ElementType }) {
  return (
    <div className="bg-[var(--surface)] border border-white/8 p-4 relative overflow-hidden">
      <Icon size={48} className="absolute top-2 right-2 opacity-[0.06]" />
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>{label}</p>
      <div className="text-2xl md:text-3xl font-black tabular-nums mb-0.5">{value}</div>
      <p className="text-[10px] text-white/30">{sub}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="w-full px-4 py-5 md:px-6 pb-24">
      <div className="h-8 w-48 shimmer-wave mb-6" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 shimmer-wave" />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div>
          <div className="h-6 w-36 shimmer-wave mb-4" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 shimmer-wave mb-1" />)}
        </div>
        <div>
          <div className="h-6 w-36 shimmer-wave mb-4" />
          <div className="h-48 shimmer-wave mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer-wave" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [resolvedTime, setResolvedTime] = useState<{ key: string; value: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setLoading(false); return; }
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => { setStats(d?.totalPlays ? d : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isSignedIn, isLoaded]);

  const tracksKey = useMemo(() =>
    (stats?.playedTracks ?? []).map(t => `${t.id}:${t.plays}:${t.duration ?? ""}`).join("|"),
    [stats]
  );

  useEffect(() => {
    if (!stats?.playedTracks.length) return;
    const known = stats.playedTracks.reduce((s, t) => s + (t.duration ?? 0) * t.plays, 0);
    const missing = stats.playedTracks.filter(t => !t.duration && t.audioUrl);
    if (!missing.length) return;
    let cancelled = false;
    Promise.all(missing.map(t => new Promise<{ plays: number; duration: number }>(res => {
      const a = document.createElement("audio");
      a.preload = "metadata";
      a.onloadedmetadata = () => { res({ plays: t.plays, duration: Math.floor(a.duration) || 0 }); a.src = ""; };
      a.onerror = () => { res({ plays: t.plays, duration: 0 }); };
      a.src = t.audioUrl;
    }))).then(resolved => {
      if (cancelled) return;
      setResolvedTime({ key: tracksKey, value: known + resolved.reduce((s, t) => s + t.duration * t.plays, 0) });
    });
    return () => { cancelled = true; };
  }, [tracksKey, stats]);

  if (!isLoaded || loading) return <Skeleton />;

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <BarChart3 size={48} className="text-white/10" />
        <h2 className="text-xl font-black">Sign in to see your stats</h2>
        <p className="text-sm text-white/40 max-w-xs">Track your listening history, top tracks and artists.</p>
        <SignInButton mode="modal">
          <button className="px-6 py-2.5 bg-[var(--primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  if (!stats || stats.totalPlays === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-3">
        <Headphones size={48} className="text-white/10" />
        <h2 className="text-xl font-black">No stats yet</h2>
        <p className="text-sm text-white/40">Start listening to build your history.</p>
      </div>
    );
  }

  const knownTime = stats.playedTracks.reduce((s, t) => s + (t.duration ?? 0) * t.plays, 0);
  const displayTime = resolvedTime?.key === tracksKey ? resolvedTime.value : knownTime || stats.totalListeningTime;
  const avgLen = stats.totalPlays > 0 ? Math.round(displayTime / stats.totalPlays) : 0;

  return (
    <div className="w-full px-4 py-5 md:px-6 pb-24">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="text-[var(--primary)]" size={22} />
        <h1 className="text-xl md:text-2xl font-black">Your Listening Stats</h1>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mb-5">
        <StatCard label="Listening Time" value={fmt(displayTime)} sub="Total play time" color="var(--primary)" icon={Clock} />
        <StatCard label="Total Plays" value={stats.totalPlays.toLocaleString()} sub="Recorded streams" color="#1DA1F2" icon={PlayCircle} />
        <StatCard label="Top Artists" value={String(stats.topArtists.length)} sub="In your leaderboard" color="#FFD700" icon={Trophy} />
        <StatCard label="Avg Length" value={`${Math.floor(avgLen/60)}:${String(avgLen%60).padStart(2,"0")}`} sub="Per track" color="#FF4500" icon={Disc3} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr] xl:items-start">
        {/* Top Tracks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Disc3 size={16} className="text-[#FF4500]" />
            <h2 className="font-black text-base">Top Tracks</h2>
          </div>
          <div className="border border-white/8">
            {stats.topTracks.map((track, i) => (
              <div key={track.id} className="relative flex items-center border-b border-white/5 last:border-0">
                <span className="w-7 text-center text-xs text-white/30 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <TrackRow track={track} queue={stats.topTracks} index={undefined} className="pr-16" />
                </div>
                <span className="absolute right-3 text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5">
                  {track.plays}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Artists */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-[#FFD700]" />
            <h2 className="font-black text-base">Top Artists</h2>
          </div>

          <ChartContainer
            className="bg-[var(--surface)] border border-white/8 p-3 mb-3 h-[180px] w-full"
            config={{ plays: { label: "Plays", color: "var(--primary)" } }}
            initialDimension={{ width: 400, height: 180 }}
          >
            <BarChart data={stats.topArtists} margin={{ top: 8, right: 4, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="bg-[#111] border border-white/10 px-2.5 py-1.5 text-xs">
                    <p className="font-bold mb-0.5">{payload[0].payload.name}</p>
                    <p className="text-[var(--primary)]">{payload[0].value} plays</p>
                  </div>
                ) : null
              } />
              <Bar dataKey="plays" radius={[3, 3, 0, 0]} maxBarSize={48}>
                {stats.topArtists.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "var(--primary)" : "rgba(30,215,96,0.4)"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-2 gap-2">
            {stats.topArtists.map((artist, i) => (
              <Link key={artist.id} href={`/artist/${artist.slug || artist.id}`}
                className="flex items-center gap-2.5 p-2.5 bg-[var(--surface)] border border-white/8 hover:bg-[var(--surface-2)] transition-colors">
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[var(--surface-2)]">
                  {artist.imageUrl && <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" unoptimized />}
                  <div className="absolute top-0 left-0 w-4 h-4 bg-[var(--primary)] text-black text-[9px] font-black flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{artist.name}</p>
                  <p className="text-[10px] text-white/30">{artist.plays} plays</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
