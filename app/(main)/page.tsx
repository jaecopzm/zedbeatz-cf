import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Disc3, Flame, ChevronRight, Users, ListMusic, Play } from "lucide-react";
import HeroSection from "@/components/home/hero-section";
import QuickPlaySection from "@/components/home/quick-play-section";
import TrendingSection from "@/components/home/trending-section";
import RecentlyPlayedSection from "@/components/home/recently-played-section";

export const metadata: Metadata = {
  title: "ZedBeatz - Download Latest Zambian Music MP3 2026",
  description: "Download latest Zambian music MP3 free. Yo Maps new songs, Chile One, Kell Kay, Chef 187 mp3 download. Stream aweah mp3 download, Zambian music 2026.",
  keywords: [
    "Zambian music download",
    "latest Zambian songs",
    "Yo Maps new songs",
    "Yo Maps mp3 download",
    "Chile One new songs",
    "Kell Kay mp3",
    "aweah mp3 download",
    "Zambian music 2026",
    "free mp3 download",
    "Zambia music streaming",
    "Chef 187",
    "Macky 2",
    "Slapdee",
    "Zambian artists",
    "ZedBeatz",
  ].join(", "),
  openGraph: {
    title: "ZedBeatz - Latest Zambian Music MP3 Download",
    description: "Download Yo Maps, Chile One, Kell Kay new songs. Free Zambian music MP3 download 2026.",
  },
};

async function getHeroTracks(): Promise<Track[]> {
  return unstable_cache(async () => {
  const { data } = await supabase
    .from("hero_tracks")
    .select("position, tracks(id, title, audio_key, cover_key, duration, slug, featured_artists, artist_id, artists(name, slug))")
    .order("position")
    .limit(5);
  if (!data || data.length === 0) return [];
  return data.map((r: any) => {
    const t = r.tracks;
    return {
      id: t.id, title: t.title,
      artistId: t.artist_id,
      artist: t.artists?.name ?? "Unknown",
      artistSlug: t.artists?.slug,
      featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
      audioUrl: getPublicUrl(t.audio_key),
      coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : undefined,
      duration: t.duration, slug: t.slug,
    };
  });
  }, ["hero-tracks"], { revalidate: 300 })();
}

function mapTrack(r: any): Track {
  return {
    id: r.id, title: r.title,
    artistId: r.artist_id ?? undefined,
    artist: (r.artists as unknown as { name: string } | null)?.name ?? "Unknown",
    artistSlug: (r.artists as unknown as { slug: string } | null)?.slug,
    featuredArtists: sanitizeFeaturedArtists(r.featured_artists),
    audioUrl: getPublicUrl(r.audio_key),
    coverUrl: r.cover_key ? getPublicUrl(r.cover_key) : undefined,
    duration: r.duration ?? undefined,
    slug: r.slug ?? undefined,
    createdAt: r.created_at ?? undefined,
  };
}

async function getLatestTracks(limit: number = 10): Promise<Track[]> {
  return unstable_cache(async () => {
  const { data } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapTrack);
  }, [`latest-tracks-${limit}`], { revalidate: 300 })(); // Increased cache time
}

async function getTrending(): Promise<Track[]> {
  return unstable_cache(async () => {
  const { data } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)")
    .order("plays", { ascending: false })
    .limit(8); // Reduced from 10
  return (data ?? []).map(mapTrack);
  }, ["trending-tracks"], { revalidate: 600 })(); // Increased cache time
}

async function getFeaturedArtists() {
  return unstable_cache(async () => {
  const priorityArtists = [
    "Yo Maps", 
    "Chile One Mr Zambia", 
    "Slapdee", 
    "Chef 187", 
    "Macky 2", 
    "Kell Kay", 
    "Dizmo", 
    "Drifta Trek"
  ];
  
  const { data } = await supabase
    .from("artists")
    .select("id, name, slug, image_key")
    .limit(20); // Reduced from 50
  
  if (!data) return [];
  
  const sorted = data.sort((a, b) => {
    const aIndex = priorityArtists.findIndex(p => 
      a.name.toLowerCase().includes(p.toLowerCase())
    );
    const bIndex = priorityArtists.findIndex(p => 
      b.name.toLowerCase().includes(p.toLowerCase())
    );
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
  
  return sorted.slice(0, 8).map((a) => ({
    id: a.id, name: a.name, slug: a.slug,
    coverUrl: a.image_key ? getPublicUrl(a.image_key) : undefined,
  }));
  }, ["featured-artists"], { revalidate: 3600 })(); // Increased to 1 hour
}

async function getPlaylists() {
  return unstable_cache(async () => {
  const { data } = await supabase
    .from("playlists")
    .select("id, name, cover_key, category")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(12);
  return (data ?? []).map((p) => ({
    id: p.id, name: p.name, category: p.category,
    coverUrl: p.cover_key ? getPublicUrl(p.cover_key) : undefined,
  }));
  }, ["featured-playlists"], { revalidate: 600 })();
}

function SectionHeader({
  icon: Icon,
  iconColor,
  title,
  href,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <div className="flex items-center gap-2.5">
        <Icon size={20} className={iconColor} />
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition-colors group"
        >
          See all
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [hero, latest, trending, artists, playlists] = await Promise.all([
    getHeroTracks(),
    getLatestTracks(12),
    getTrending(),
    getFeaturedArtists(),
    getPlaylists(),
  ]);

  const heroTracks = hero.length > 0 ? hero : latest.slice(0, 5);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";

  // JSON-LD structured data for homepage
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ZedBeatz",
    "url": baseUrl,
    "description": "Download latest Zambian music MP3. Stream Yo Maps, Chile One, Kell Kay new songs.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ZedBeatz",
      "url": baseUrl,
      "logo": `${baseUrl}/Logo.png`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen pb-32">
      {/* Hero */}
      <HeroSection tracks={heroTracks} />

      {/* Trending */}
      {trending.length > 0 && (
        <section className="px-4 md:px-8 mb-8 md:mb-14">
          <SectionHeader
            icon={Flame}
            iconColor="text-orange-400"
            title="Trending Now"
            href="/tracks"
          />
          <TrendingSection tracks={trending} />
        </section>
      )}

      {/* Recently Played */}
      <section className="px-4 md:px-8 mb-8 md:mb-14">
        <SectionHeader
          icon={Clock}
          iconColor="text-blue-400"
          title="Recently Played"
          href="/library"
        />
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
          <RecentlyPlayedSection />
        </div>
      </section>

      {/* New Releases */}
      <section className="px-4 md:px-8 mb-8 md:mb-14">
        <SectionHeader
          icon={Disc3}
          iconColor="text-[var(--primary)]"
          title="New Releases"
          href="/tracks"
        />
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
          {latest.slice(0, 12).map((t) => (
            <TrackCard key={t.id} track={t} queue={latest} />
          ))}
        </div>
      </section>

      {/* Featured Artists */}
      {artists.length > 0 && (
        <section className="px-4 md:px-8 mb-8 md:mb-14">
          <SectionHeader
            icon={Users}
            iconColor="text-purple-400"
            title="Featured Artists"
            href="/browse"
          />
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 md:gap-6">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artist/${artist.slug || artist.id}`}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="relative w-full aspect-square rounded-full bg-[var(--surface-3)] flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                  {artist.coverUrl ? (
                    <img src={artist.coverUrl} alt={artist.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Users size={20} className="text-[var(--muted)]" />
                  )}
                </div>
                
                <p className="text-[10px] md:text-sm font-semibold text-center truncate w-full group-hover:underline leading-tight">
                  {artist.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <section className="px-4 md:px-8 mb-14">
          <SectionHeader
            icon={ListMusic}
            iconColor="bg-green-500/20 text-green-400"
            title="Playlists"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="flex flex-col gap-3 p-4 rounded-2xl glass-card hover:bg-[var(--surface-hover)] hover:border-[var(--primary)]/30 hover:shadow-[0_8px_30px_rgba(30,215,96,0.12)] hover:-translate-y-1.5 transition-all duration-500 group"
              >
                <div className="relative aspect-square rounded-xl bg-[var(--surface-3)] flex items-center justify-center overflow-hidden shadow-xl">
                  {playlist.coverUrl ? (
                    <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  ) : (
                    <ListMusic size={40} className="text-[var(--muted)] transition-transform duration-500 group-hover:scale-110" />
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-14 h-14 rounded-full bg-[var(--primary)] text-black flex items-center justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[var(--glow-primary)] hover:scale-105 hover:bg-[var(--primary-hover)]">
                      <Play fill="currentColor" size={22} className="ml-1" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-1">
                  <p className="text-sm font-bold truncate group-hover:text-[var(--primary)] transition-colors">
                    {playlist.name}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] font-medium mt-1 tracking-wider uppercase">
                    {playlist.category || "Playlist"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  );
}
