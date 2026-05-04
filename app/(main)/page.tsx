import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, Disc3, Flame, ChevronRight, Users, ListMusic, LayoutGrid } from "lucide-react";
import HeroSection from "@/components/home/hero-section";
import TrendingSection from "@/components/home/trending-section";
import RecentlyPlayedSection from "@/components/home/recently-played-section";
import ScrollRow from "@/components/home/scroll-row";
import HomeGreeting from "@/components/home/home-greeting";
import { Suspense } from "react";
import { RecentlyPlayedSkeleton } from "@/components/home/home-skeletons";
import ReleaseRadar from "@/components/home/release-radar";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
const ogImage = new URL("/Logo.png", siteUrl).toString();

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
    url: siteUrl,
    title: "ZedBeatz - Latest Zambian Music MP3 Download",
    description:
      "Download Yo Maps, Chile One, Kell Kay new songs. Free Zambian music MP3 download 2026.",
    images: [
      {
        url: ogImage,
        width: 1800,
        height: 400,
        alt: "ZedBeatz logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZedBeatz - Download Latest Zambian Music MP3 2026",
    description:
      "Download latest Zambian music MP3 free. Yo Maps new songs, Chile One, Kell Kay, Chef 187 mp3 download.",
    images: [ogImage],
  },
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

/* ─── Data Fetcher ─────────────────────────────────────── */
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";

const TRACK_SELECT = "id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)";

function mapTrack(r: any): Track {
  return {
    id: r.id, title: r.title, artistId: r.artist_id ?? undefined,
    artist: r.artists?.name ?? "Unknown",
    artistSlug: r.artists?.slug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(r.featured_artists),
    audioUrl: getPublicUrl(r.audio_key),
    coverUrl: r.cover_key ? getPublicUrl(r.cover_key) : undefined,
    duration: r.duration ?? undefined,
    slug: r.slug ?? undefined,
  };
}

async function getHomeData() {
  const [heroRes, trendingRes, latestRes, artistsRes, albumsRes, playlistsRes, featuredAlbumRes] = await Promise.all([
    supabase.from("hero_tracks").select(`position, tracks(${TRACK_SELECT})`).order("position").limit(5),
    supabase.from("tracks").select(TRACK_SELECT).order("plays", { ascending: false }).limit(8),
    supabase.from("tracks").select(TRACK_SELECT).order("created_at", { ascending: false }).limit(20),
    supabase.from("artists").select("id, name, slug, image_key").limit(40),
    supabase.from("albums").select("id, title, cover_key, release_year, slug, artists(name, slug)").order("release_year", { ascending: false }).limit(20),
    supabase.from("playlists").select("id, name, cover_key, category").eq("is_featured", true).order("created_at", { ascending: false }).limit(20),
    (supabase.from("albums") as any).select("id, title, cover_key, release_year, slug, artists(name, slug)").eq("is_featured", true).limit(1).maybeSingle(),
  ]);

  const heroTracks = (heroRes.data ?? []).map((r: any) => mapTrack(r.tracks));
  const trending = (trendingRes.data ?? []).map(mapTrack);
  const latest = (latestRes.data ?? []).map(mapTrack);

  const PRIORITY = ["Yo Maps", "Chile One", "Slapdee", "Chef 187", "Macky 2", "Kell Kay", "Dizmo", "Drifta Trek"];
  const artists = (artistsRes.data ?? [])
    .sort((a: any, b: any) => {
      const ai = PRIORITY.findIndex(p => a.name.toLowerCase().includes(p.toLowerCase()));
      const bi = PRIORITY.findIndex(p => b.name.toLowerCase().includes(p.toLowerCase()));
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 20)
    .map((a: any) => ({ id: a.id, name: a.name, slug: a.slug, coverUrl: a.image_key ? getPublicUrl(a.image_key) : null }));

  const albums = (albumsRes.data ?? []).map((a: any) => ({
    id: a.id, title: a.title, slug: a.slug,
    releaseYear: a.release_year ?? null,
    artistName: a.artists?.name ?? "Unknown",
    coverUrl: a.cover_key ? getPublicUrl(a.cover_key) : null,
  }));

  const playlists = (playlistsRes.data ?? []).map((p: any) => ({
    id: p.id, name: p.name, category: p.category,
    coverUrl: p.cover_key ? getPublicUrl(p.cover_key) : null,
  }));

  const fa = featuredAlbumRes.data;
  const featuredAlbum = fa ? {
    id: fa.id, title: fa.title, slug: fa.slug,
    releaseYear: fa.release_year,
    artistName: (fa.artists as any)?.name ?? "Unknown",
    artistSlug: (fa.artists as any)?.slug ?? null,
    coverUrl: fa.cover_key ? getPublicUrl(fa.cover_key) : null,
  } : null;

  return { heroTracks, trending, latest, artists, albums, playlists, featuredAlbum };
}

/* ─── Section Header ─────────────────────────────────────── */
function SectionHeader({
  icon: _Icon, title, href,
}: {
  icon: React.ElementType;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <h2 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-wider group">
          See all
          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";
  const data = await getHomeData();

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
    publisher: { "@type": "Organization", name: "ZedBeatz", url: baseUrl, logo: `${baseUrl}/Logo.png` },
  };

  const heroTracks: Track[] = data ? (data.heroTracks.length > 0 ? data.heroTracks : data.latest.slice(0, 5)) : [];
  const trending: Track[] = data?.trending ?? [];
  const latest: Track[] = data?.latest ?? [];
  const artists: any[] = data?.artists ?? [];
  const albums: any[] = data?.albums ?? [];
  const playlists: any[] = data?.playlists ?? [];
  const featuredAlbum = data?.featuredAlbum ?? null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative pb-6">
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="animate-ambient absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #1ed760 0%, transparent 70%)", animationDelay: "2s" }} />
          <div className="animate-ambient absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.03]"
            style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)", animationDelay: "7s" }} />
        </div>

        <HomeGreeting />

        {/* Hero */}
        <div className="mt-4">
          <HeroSection tracks={heroTracks} featuredAlbum={featuredAlbum} />
        </div>

        {/* Trending */}
        {trending.length > 0 && (
          <section className="px-4 md:px-8 mb-10 md:mb-14">
            <SectionHeader icon={Flame} title="Trending Now" href="/tracks" />
            <TrendingSection tracks={trending} />
          </section>
        )}

        {/* Recently Played */}
        <section className="px-4 md:px-6 mb-6 md:mb-8">
          <SectionHeader icon={Clock} title="Recently Played" href="/library" />
          <Suspense fallback={<RecentlyPlayedSkeleton />}>
            <RecentlyPlayedSection />
          </Suspense>
        </section>

        {/* Release Radar */}
        <ReleaseRadar />

        {/* New Releases */}
        {latest.length > 0 && (
          <section className="mb-6 md:mb-8">
            <div className="px-4 md:px-6">
              <SectionHeader icon={Disc3} title="New Releases" href="/tracks" />
            </div>
            <ScrollRow>
              {latest.map((t) => (
                <div key={t.id} className="flex-shrink-0 w-[140px] md:w-[176px] snap-start">
                  <TrackCard track={t} queue={latest} bare />
                </div>
              ))}
            </ScrollRow>
          </section>
        )}

        {/* Featured Artists */}
        {artists.length > 0 && (
          <section className="mb-6 md:mb-8">
            <div className="px-4 md:px-6">
              <SectionHeader icon={Users} title="Featured Artists" href="/browse" />
            </div>
            <ScrollRow arrowTop={40}>
              {artists.map((artist) => (
                <Link key={artist.id} href={`/artist/${artist.slug || artist.id}`}
                  className="group flex flex-col items-center gap-2 shrink-0 snap-start w-[80px] md:w-[96px]">
                  <div className="relative w-[80px] h-[80px] md:w-[96px] md:h-[96px]">
                    <div className="absolute inset-[-3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: "conic-gradient(from 0deg, #1ed760, #a855f7, #3b82f6, #1ed760)", animation: "spin-ring 3s linear infinite" }} />
                    <div className="absolute inset-0 rounded-full bg-[var(--background)] scale-[0.94]" />
                    <div className="absolute inset-[3px] rounded-full overflow-hidden bg-[var(--surface-3)] shadow-lg transition-transform duration-300 group-hover:scale-105">
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center -z-10">
                        <Users size={24} className="text-[var(--muted)]/50" />
                      </div>
                      {artist.coverUrl && <Image src={artist.coverUrl} alt={artist.name} fill className="object-cover" unoptimized />}
                    </div>
                  </div>
                  <p className="text-[11px] md:text-xs font-semibold text-center leading-tight w-full truncate group-hover:text-[var(--primary)] transition-colors duration-200">
                    {artist.name}
                  </p>
                </Link>
              ))}
            </ScrollRow>
          </section>
        )}

        {/* Albums */}
        {albums.length > 0 && (
          <section className="mb-6">
            <div className="px-4 md:px-8">
              <SectionHeader icon={LayoutGrid} title="Albums" href="/browse" />
            </div>
            <ScrollRow>
              {albums.map((album) => (
                <Link key={album.id} href={`/album/${album.slug || album.id}`} className="group flex-shrink-0 w-[140px] md:w-[176px] snap-start">
                  <div className="relative w-full aspect-square overflow-hidden bg-[var(--surface-3)] mb-2.5 shadow-lg ring-1 ring-white/5 group-hover:ring-[var(--primary)]/40 transition-all duration-400">
                    {album.coverUrl && <Image src={album.coverUrl} alt={album.title} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-600" unoptimized />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {album.releaseYear && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[10px] font-semibold text-white/80">{album.releaseYear}</div>
                    )}
                  </div>
                  <p className="text-xs md:text-sm font-bold truncate group-hover:text-[var(--primary)] transition-colors">{album.title}</p>
                  <p className="text-[10px] md:text-xs text-[var(--muted)] truncate mt-0.5">{album.artistName}</p>
                </Link>
              ))}
            </ScrollRow>
          </section>
        )}

        {/* Playlists */}
        {playlists.length > 0 && (
          <section className="mb-4">
            <div className="px-4 md:px-8">
              <SectionHeader icon={ListMusic} title="Playlists" />
            </div>
            <ScrollRow>
              {playlists.map((playlist) => (
                <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="group flex-shrink-0 w-[140px] md:w-[176px] snap-start">
                  <div className="relative w-full aspect-square overflow-hidden bg-[var(--surface-3)] mb-2.5 shadow-lg ring-1 ring-white/5 group-hover:ring-[var(--primary)]/40 transition-all duration-400">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center -z-10">
                      <ListMusic size={32} className="text-[var(--muted)]/40" />
                    </div>
                    {playlist.coverUrl && <Image src={playlist.coverUrl} alt={playlist.name} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-600" unoptimized />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <p className="text-xs md:text-sm font-bold truncate group-hover:text-[var(--primary)] transition-colors">{playlist.name}</p>
                  <p className="text-[10px] md:text-xs text-[var(--muted)] truncate mt-0.5">Playlist</p>
                </Link>
              ))}
            </ScrollRow>
          </section>
        )}
      </div>
    </>
  );
}

/* ─── Async Server Sub-components ───────────────────────── */

