import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Clock, Disc3, Flame, ChevronRight,
  Users, ListMusic, Play, LayoutGrid,
} from "lucide-react";
import HeroSection from "@/components/home/hero-section";
import TrendingSection from "@/components/home/trending-section";
import RecentlyPlayedSection from "@/components/home/recently-played-section";
import ScrollRow from "@/components/home/scroll-row";
import HomeGreeting from "@/components/home/home-greeting";
import { Suspense } from "react";
import {
  HeroSkeleton, TrendingSkeleton, TrackGridSkeleton,
  ArtistGridSkeleton, PlaylistGridSkeleton, RecentlyPlayedSkeleton,
} from "@/components/home/home-skeletons";
import ContinueListening from "@/components/home/continue-listening";
import ReleaseRadar from "@/components/home/release-radar";

export const metadata: Metadata = {
  title: "ZedBeatz - Download Latest Zambian Music MP3 2026",
  description:
    "Download latest Zambian music MP3 free. Yo Maps new songs, Chile One, Kell Kay, Chef 187 mp3 download. Stream aweah mp3 download, Zambian music 2026.",
  keywords: [
    "Zambian music download", "latest Zambian songs", "Yo Maps new songs",
    "Yo Maps mp3 download", "Chile One new songs", "Kell Kay mp3",
    "aweah mp3 download", "Zambian music 2026", "free mp3 download",
    "Zambia music streaming", "Chef 187", "Macky 2", "Slapdee",
    "Zambian artists", "ZedBeatz",
  ].join(", "),
  openGraph: {
    title: "ZedBeatz - Latest Zambian Music MP3 Download",
    description:
      "Download Yo Maps, Chile One, Kell Kay new songs. Free Zambian music MP3 download 2026.",
  },
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

/* ─── Data Fetchers ─────────────────────────────────────── */
async function getHeroTracks(): Promise<Track[]> {
  const { data } = await supabase
    .from("hero_tracks")
    .select(
      "position, tracks(id, title, audio_key, cover_key, duration, slug, featured_artists, artist_id, artists(name, slug))"
    )
    .order("position")
    .limit(5);
  if (!data || data.length === 0) return [];
  return data.map((r: any) => {
    const t = r.tracks;
    return {
      id: t.id, title: t.title, artistId: t.artist_id,
      artist: t.artists?.name ?? "Unknown", artistSlug: t.artists?.slug,
      featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
      audioUrl: getPublicUrl(t.audio_key),
      coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : undefined,
      duration: t.duration, slug: t.slug,
    };
  });
}

function mapTrack(r: any): Track {
  return {
    id: r.id, title: r.title, artistId: r.artist_id ?? undefined,
    artist: (r.artists as unknown as { name: string } | null)?.name ?? "Unknown",
    artistSlug: (r.artists as unknown as { slug: string } | null)?.slug,
    featuredArtists: sanitizeFeaturedArtists(r.featured_artists),
    audioUrl: getPublicUrl(r.audio_key),
    coverUrl: r.cover_key ? getPublicUrl(r.cover_key) : undefined,
    duration: r.duration ?? undefined, slug: r.slug ?? undefined,
    createdAt: r.created_at ?? undefined,
  };
}

async function getLatestTracks(limit = 12): Promise<Track[]> {
  const { data } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, created_at, artists(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapTrack);
}

async function getTrending(): Promise<Track[]> {
  const { data } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)")
    .order("plays", { ascending: false })
    .limit(5);
  return (data ?? []).map(mapTrack);
}

async function getFeaturedArtists() {
  const priority = [
    "Yo Maps", "Chile One Mr Zambia", "Slapdee", "Chef 187",
    "Macky 2", "Kell Kay", "Dizmo", "Drifta Trek",
  ];
  const { data } = await supabase
    .from("artists")
    .select("id, name, slug, image_key")
    .limit(40);
  if (!data) return [];
  const sorted = data.sort((a, b) => {
    const ai = priority.findIndex(p => a.name.toLowerCase().includes(p.toLowerCase()));
    const bi = priority.findIndex(p => b.name.toLowerCase().includes(p.toLowerCase()));
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
  return sorted.slice(0, 20).map(a => ({
    id: a.id, name: a.name, slug: a.slug,
    coverUrl: a.image_key ? getPublicUrl(a.image_key) : undefined,
  }));
}

async function getPlaylists() {
  const { data } = await supabase
    .from("playlists")
    .select("id, name, cover_key, category")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map(p => ({
    id: p.id, name: p.name, category: p.category,
    coverUrl: p.cover_key ? getPublicUrl(p.cover_key) : undefined,
  }));
}

async function getAlbums() {
  const { data } = await supabase
    .from("albums")
    .select("id, title, cover_key, release_year, artist_id, slug, artists(name, slug)")
    .order("release_year", { ascending: false })
    .limit(20);
  return (data ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    releaseYear: a.release_year ?? null,
    artistName: (a.artists as { name: string } | null)?.name ?? "Unknown",
    artistSlug: (a.artists as { slug: string } | null)?.slug ?? null,
    coverUrl: a.cover_key ? getPublicUrl(a.cover_key) : undefined,
  }));
}

/* ─── Section Header ─────────────────────────────────────── */
const ACCENT_COLORS: Record<string, string> = {
  orange: "from-orange-500 to-amber-400",
  amber:  "from-amber-400 to-yellow-300",
  blue:   "from-blue-500 to-cyan-400",
  green:  "from-[var(--primary)] to-emerald-400",
  purple: "from-purple-500 to-violet-400",
  rose:   "from-rose-500 to-pink-400",
};

function SectionHeader({
  icon: _Icon, accent = "green", title, href, count,
}: {
  icon: React.ElementType;
  accent?: keyof typeof ACCENT_COLORS;
  title: string;
  href?: string;
  count?: number;
}) {
  const gradient = ACCENT_COLORS[accent] ?? ACCENT_COLORS.green;
  return (
    <div className="flex items-center justify-between mb-5 md:mb-7">
      <div className="flex items-center gap-3">
        {/* Accent bar */}
        <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${gradient} shrink-0`} />
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
        {count != null && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[11px] font-semibold text-[var(--muted)]">
            {count}
          </span>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs font-semibold text-[var(--muted)] hover:text-white hover:border-white/20 hover:bg-white/5 transition-all group"
        >
          See all
          <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";
  const hour = new Date().getHours();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ZedBeatz",
    url: baseUrl,
    description: "Download latest Zambian music MP3. Stream Yo Maps, Chile One, Kell Kay new songs.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "ZedBeatz",
      url: baseUrl,
      logo: `${baseUrl}/Logo.png`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative min-h-screen pb-32">
        {/* Page-level ambient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="animate-ambient absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #1ed760 0%, transparent 70%)", animationDelay: "2s" }} />
          <div className="animate-ambient absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.03]"
            style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)", animationDelay: "7s" }} />
        </div>

        {/* Greeting */}
        <HomeGreeting hour={hour} />

        {/* Continue Listening */}
        <ContinueListening />

        {/* Hero */}
        <div className="mt-4">
          <Suspense fallback={<HeroSkeleton />}>
            <HeroContent />
          </Suspense>
        </div>

        {/* Trending */}
        <section className="px-4 md:px-8 mb-10 md:mb-14">
          <SectionHeader icon={Flame} accent="orange" title="Trending Now" href="/tracks" />
          <Suspense fallback={<TrendingSkeleton />}>
            <TrendingContent />
          </Suspense>
        </section>

        {/* Recently Played */}
        <section className="px-4 md:px-8 mb-10 md:mb-14">
          <SectionHeader icon={Clock} accent="blue" title="Recently Played" href="/library" />
          <Suspense fallback={<RecentlyPlayedSkeleton />}>
            <RecentlyPlayedSection />
          </Suspense>
        </section>

        {/* Release Radar */}
        <ReleaseRadar />

        {/* New Releases */}
        <section className="mb-10 md:mb-14">
          <div className="px-4 md:px-8">
            <SectionHeader icon={Disc3} accent="green" title="New Releases" href="/tracks" />
          </div>
          <Suspense fallback={<div className="px-4 md:px-8"><TrackGridSkeleton /></div>}>
            <NewReleasesContent />
          </Suspense>
        </section>

        {/* Featured Artists */}
        <section className="mb-10 md:mb-14">
          <div className="px-4 md:px-8">
            <SectionHeader icon={Users} accent="purple" title="Featured Artists" href="/browse" />
          </div>
          <Suspense fallback={<div className="px-4 md:px-8"><ArtistGridSkeleton /></div>}>
            <FeaturedArtistsContent />
          </Suspense>
        </section>

        {/* Albums */}
        <section className="mb-10 md:mb-14">
          <div className="px-4 md:px-8">
            <SectionHeader icon={LayoutGrid} accent="amber" title="Albums" href="/browse" />
          </div>
          <Suspense fallback={<div className="px-4 md:px-8"><TrackGridSkeleton count={8} /></div>}>
            <AlbumsContent />
          </Suspense>
        </section>

        {/* Playlists */}
        <section className="mb-14">
          <div className="px-4 md:px-8">
            <SectionHeader icon={ListMusic} accent="rose" title="Playlists" />
          </div>
          <Suspense fallback={<div className="px-4 md:px-8"><PlaylistGridSkeleton /></div>}>
            <PlaylistsContent />
          </Suspense>
        </section>
      </div>
    </>
  );
}

/* ─── Async Server Sub-components ───────────────────────── */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function HeroContent() {
  const [hero, latest] = await Promise.all([getHeroTracks(), getLatestTracks(12), delay(800)]);
  const heroTracks = hero.length > 0 ? hero : latest.slice(0, 5);
  return <HeroSection tracks={heroTracks} />;
}

async function TrendingContent() {
  const [trending] = await Promise.all([getTrending(), delay(600)]);
  if (trending.length === 0) return null;
  return <TrendingSection tracks={trending} />;
}

async function NewReleasesContent() {
  const [latest] = await Promise.all([getLatestTracks(20), delay(700)]);
  return (
    <ScrollRow>
      {latest.map((t) => (
        <div key={t.id} className="flex-shrink-0 w-[140px] md:w-[176px] snap-start">
          <TrackCard track={t} queue={latest} bare />
        </div>
      ))}
    </ScrollRow>
  );
}

async function FeaturedArtistsContent() {
  const [artists] = await Promise.all([getFeaturedArtists(), delay(650)]);
  if (artists.length === 0) return null;
  return (
    <ScrollRow arrowTop={48}>
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artist/${artist.slug || artist.id}`}
          className="group flex flex-col items-center gap-2 shrink-0 snap-start w-[80px] md:w-[96px]"
        >
          <div className="relative w-[80px] h-[80px] md:w-[96px] md:h-[96px]">
            <div className="absolute inset-[-3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: "conic-gradient(from 0deg, #1ed760, #a855f7, #3b82f6, #1ed760)",
                animation: "spin-ring 3s linear infinite",
              }} />
            <div className="absolute inset-0 rounded-full bg-[var(--background)] scale-[0.94]" />
            <div className="absolute inset-[3px] rounded-full overflow-hidden bg-[var(--surface-3)] shadow-lg transition-transform duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center -z-10">
                <Users size={24} className="text-[var(--muted)]/50" />
              </div>
              {artist.coverUrl && (
                <Image src={artist.coverUrl} alt={artist.name} fill className="object-cover" unoptimized />
              )}
            </div>
          </div>
          <p className="text-[11px] md:text-xs font-semibold text-center leading-tight w-full truncate group-hover:text-[var(--primary)] transition-colors duration-200">
            {artist.name}
          </p>
        </Link>
      ))}
    </ScrollRow>
  );
}

async function PlaylistsContent() {
  const [playlists] = await Promise.all([getPlaylists(), delay(750)]);
  if (playlists.length === 0) return null;

  const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    "Hip Hop": { bg: "rgba(234,179,8,0.12)",   text: "#eab308", border: "rgba(234,179,8,0.3)"   },
    "R&B":     { bg: "rgba(236,72,153,0.12)",  text: "#ec4899", border: "rgba(236,72,153,0.3)"  },
    "Gospel":  { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", border: "rgba(59,130,246,0.3)"  },
    "Afro":    { bg: "rgba(249,115,22,0.12)",  text: "#fb923c", border: "rgba(249,115,22,0.3)"  },
    "Pop":     { bg: "rgba(168,85,247,0.12)",  text: "#c084fc", border: "rgba(168,85,247,0.3)"  },
    "Chill":   { bg: "rgba(6,182,212,0.12)",   text: "#22d3ee", border: "rgba(6,182,212,0.3)"   },
  };

  return (
    <ScrollRow>
      {playlists.map((playlist) => {
          const cat = playlist.category ? CATEGORY_COLORS[playlist.category] : null;
          return (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group flex-shrink-0 w-[140px] md:w-[176px] snap-start"
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[var(--surface-3)] mb-2.5 shadow-lg ring-1 ring-white/5 group-hover:ring-[var(--primary)]/40 group-hover:shadow-[0_8px_30px_rgba(30,215,96,0.15)] transition-all duration-400">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center -z-10">
                  <ListMusic size={32} className="text-[var(--muted)]/40" />
                </div>
                {playlist.coverUrl && (
                  <Image src={playlist.coverUrl} alt={playlist.name} fill className="object-cover transition-transform duration-600 group-hover:scale-105" unoptimized />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {playlist.category && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={cat ? { background: cat.bg, color: cat.text } : { background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.8)" }}>
                    {playlist.category}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-[var(--primary)] flex items-center justify-center translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-350 shadow-[var(--glow-primary)]">
                    <Play fill="currentColor" size={16} className="text-black ml-0.5" />
                  </div>
                </div>
              </div>
              <p className="text-xs md:text-sm font-bold truncate leading-tight group-hover:text-[var(--primary)] transition-colors">{playlist.name}</p>
              <p className="text-[10px] md:text-xs text-[var(--muted)] truncate mt-0.5">Playlist</p>
            </Link>
          );
        })}
    </ScrollRow>
  );
}

async function AlbumsContent() {
  const [albums] = await Promise.all([getAlbums(), delay(700)]);
  if (albums.length === 0) return null;
  return (
    <ScrollRow>
      {albums.map((album) => (
        <Link key={album.id} href={`/album/${album.slug || album.id}`} className="group flex-shrink-0 w-[140px] md:w-[176px] snap-start">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[var(--surface-3)] mb-2.5 shadow-lg ring-1 ring-white/5 group-hover:ring-[var(--primary)]/40 group-hover:shadow-[0_8px_30px_rgba(30,215,96,0.15)] transition-all duration-400">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center -z-10">
              <LayoutGrid size={32} className="text-[var(--muted)]/40" />
            </div>
            {album.coverUrl && (
              <Image src={album.coverUrl} alt={album.title} fill className="object-cover transition-transform duration-600 group-hover:scale-105" unoptimized />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {album.releaseYear && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-white/80">
                {album.releaseYear}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-[var(--primary)] flex items-center justify-center translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-350 shadow-[var(--glow-primary)]">
                <Play fill="currentColor" size={16} className="text-black ml-0.5" />
              </div>
            </div>
          </div>
          <p className="text-xs md:text-sm font-bold truncate leading-tight group-hover:text-[var(--primary)] transition-colors">{album.title}</p>
          <p className="text-[10px] md:text-xs text-[var(--muted)] truncate mt-0.5">{album.artistName}</p>
        </Link>
      ))}
    </ScrollRow>
  );
}
