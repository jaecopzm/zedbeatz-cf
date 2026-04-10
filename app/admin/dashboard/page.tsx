"use client";
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/db";
import { TrendingUp, Music, Users, Play } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  // Get stats
  const [
    { count: totalTracks },
    { count: totalArtists },
    { data: topTracks },
    { data: topArtists },
  ] = await Promise.all([
    supabase.from("tracks").select("*", { count: "exact", head: true }),
    supabase.from("artists").select("*", { count: "exact", head: true }),
    supabase.from("tracks").select("id, title, plays, artists(name)").order("plays", { ascending: false }).limit(10),
    supabase.from("artists").select("id, name, tracks(plays)").limit(10),
  ]);

  const artistsWithPlays = (topArtists ?? []).map(a => ({
    ...a,
    totalPlays: (a.tracks as any[]).reduce((sum, t) => sum + (t.plays || 0), 0)
  })).sort((a, b) => b.totalPlays - a.totalPlays).slice(0, 10);

  const totalPlays = (topTracks ?? []).reduce((sum, t) => sum + (t.plays || 0), 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Admin <span className="text-[var(--primary)]">Dashboard</span></h1>
          <p className="text-[var(--muted)] text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            System Performance & Analytics Live
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/upload" className="px-6 py-3 bg-[var(--primary)] text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-[var(--glow-primary)] hover:scale-105 transition-all">
            Quick Upload
          </Link>
          <div className="hidden md:flex flex-col items-end text-right">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Operational Status</span>
             <span className="text-xs font-black text-[var(--primary)] uppercase tracking-widest">All Services Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Tracks", value: totalTracks ?? 0, icon: Music, color: "var(--primary)" },
          { label: "Total Artists", value: totalArtists ?? 0, icon: Users, color: "#8b5cf6" },
          { label: "Platform Plays", value: totalPlays.toLocaleString(), icon: Play, color: "#06b6d4" },
          { label: "Average Reach", value: totalTracks ? Math.round(totalPlays / totalTracks) : 0, icon: TrendingUp, color: "#f59e0b" }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border-white/5 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: stat.color }} />
            <div className="relative z-10 flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{stat.label}</span>
              <div className="p-2.5 rounded-xl bg-white/5 text-white/60 group-hover:text-white transition-colors">
                 <stat.icon size={18} />
              </div>
            </div>
            <p className="relative z-10 text-3xl font-black tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Tracks */}
        <div className="lg:col-span-2 glass-card rounded-3xl border-white/5 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between mb-8">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/60">Global Chart Performance</h2>
            <Link href="/admin" className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline underline-offset-4">Full Catalog</Link>
          </div>
          
          <div className="relative z-10 space-y-1">
            {(topTracks ?? []).map((track, i) => (
              <div key={track.id} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                <span className="text-[10px] font-black text-white/10 w-4 text-center group-hover:text-[var(--primary)]/40 transition-colors uppercase tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate group-hover:text-white transition-colors">{track.title}</p>
                  <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest truncate">
                    {(track.artists as any)?.name ?? "Unknown Artist"}
                  </p>
                </div>
                <div className="text-right">
                   <p className="text-sm font-black text-[var(--primary)] tabular-nums">{(track.plays ?? 0).toLocaleString()}</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/10 group-hover:text-white/20 transition-colors">Total Plays</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Artists - Sidebar Style */}
        <div className="glass-card rounded-3xl border-white/5 p-8 relative overflow-hidden">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/60 mb-8">Elite Creators</h2>
          <div className="space-y-6">
            {artistsWithPlays.map((artist, i) => (
              <div key={artist.id} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-[var(--primary)] relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                   <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/10 to-purple-500/10" />
                   {artist.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-white/80 group-hover:text-white transition-colors">{artist.name}</p>
                  <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                    {(artist.tracks as any[]).length} RELEASES
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-white/40 tabular-nums">
                    {artist.totalPlays > 1000 ? `${(artist.totalPlays / 1000).toFixed(1)}K` : artist.totalPlays} 
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Quick Access */}
      <div className="pb-12">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 mb-6 text-center">Platform Management Shortcuts</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/admin/upload", label: "Global Upload", desc: "Push new tracks", icon: Music },
            { href: "/admin/artists", label: "Artist Hub", desc: "Manage creators", icon: Users },
            { href: "/admin", label: "Track Vault", desc: "Catalog management", icon: Music },
            { href: "/admin/albums", label: "Album Architect", desc: "Bundle releases", icon: TrendingUp }
          ].map((action, i) => (
            <Link 
              key={i} 
              href={action.href} 
              className="glass-card p-6 rounded-3xl border-white/5 text-center hover:bg-white/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-[var(--primary)] group-hover:text-black transition-all duration-500">
                 <action.icon size={20} />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-white group-hover:text-[var(--primary)] transition-colors mb-1">{action.label}</p>
              <p className="text-[10px] text-white/20 uppercase tracking-widest font-black group-hover:text-white/40 transition-colors">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
