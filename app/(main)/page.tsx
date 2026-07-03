import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import HeroSection from "@/components/home/hero-section";
import TrendingSection from "@/components/home/trending-section";
import RecentlyPlayedSection from "@/components/home/recently-played-section";
import ScrollRow from "@/components/home/scroll-row";
import HomeGreeting from "@/components/home/home-greeting";
import { Suspense } from "react";
import { RecentlyPlayedSkeleton } from "@/components/home/home-skeletons";
import ContinueListening from "@/components/home/continue-listening";
import GenresMoods from "@/components/home/genres-moods";
import ReleaseRadar from "@/components/home/release-radar";
import RadioStations from "@/components/home/radio-stations";
import type { RadioStation } from "@/components/home/radio-stations";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
const ogImage = new URL("/Logo.png", siteUrl).toString();

export const metadata: Metadata = {
  title: "ZedBeatz - Download Latest Zambian Music MP3 2026",
  description:
    "Download latest Zambian music MP3 free in 2026. Yo Maps new songs, Chile One, Kell Kay, Chef 187 mp3 download. Stream aweah mp3, Zambian music 2026. #1 platform for Zambian music download and streaming.",
  keywords: [
    "Zambian music download", "latest Zambian songs", "Yo Maps new songs",
    "Yo Maps mp3 download", "Chile One new songs", "Kell Kay mp3",
    "aweah mp3 download", "Zambian music 2026", "free mp3 download Zambia",
    "Zambia music streaming", "ZedBeatz"
  ],
  openGraph: {
    url: siteUrl,
    title: "ZedBeatz - Latest Zambian Music MP3 Download",
    description:
      "Download Yo Maps, Chile One, Kell Kay new songs. Free Zambian music MP3 download 2026 on ZedBeatz.",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "ZedBeatz - Zambian Music Streaming Platform",
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
  alternates: {
    canonical: siteUrl,
  },
};

export const revalidate = 60;

/* ─── Data Fetcher ─────────────────────────────────────── */
import { db } from "@/lib/db/drizzle";
import { tracks, artists, albums, playlists, heroTracks } from "@/lib/db/schema";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { eq, desc, asc, and, isNotNull, ne } from "drizzle-orm";

function mapTrack(r: any): Track {
  const audioUrl = getAudioUrl({
    isrc:      r.isrc,
    deezerId:  r.deezerId,
    spotifyId: r.spotifyId,
    audioKey:  r.audioKey,
  });
  const coverUrl = getCoverUrl({
    coverUrl: r.coverUrl,
    coverKey: r.coverKey,
  });
  return {
    id: r.id, title: r.title, artistId: r.artistId ?? undefined,
    artist: r.artistName ?? "Unknown",
    artistSlug: r.artistSlug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(r.featuredArtists),
    isrc: r.isrc ?? undefined,
    deezerId: r.deezerId ?? undefined,
    spotifyId: r.spotifyId ?? undefined,
    audioUrl: audioUrl ?? "",
    coverUrl: coverUrl ?? undefined,
    duration: r.duration ? Number(r.duration) : undefined,
    slug: r.slug ?? undefined,
    status: r.status ?? undefined,
  };
}

// Shared track columns — include all CDN identifiers + legacy R2 keys
const trackCols = {
  id: tracks.id,
  title: tracks.title,
  audioKey: tracks.audioKey,
  coverKey: tracks.coverKey,
  coverUrl: tracks.coverUrl,
  isrc: tracks.isrc,
  deezerId: tracks.deezerId,
  spotifyId: tracks.spotifyId,
  duration: tracks.duration,
  slug: tracks.slug,
  featuredArtists: tracks.featuredArtists,
  artistId: tracks.artistId,
  status: tracks.status,
} as const;

async function getHomeData() {
  const [heroRes, trendingRes, latestRes, artistsRes, albumsRes, playlistsRes, featuredAlbumRes, popularRes, radioRes, genreRows] = await Promise.all([
    db
      .select({
        position: heroTracks.position,
        ...trackCols,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(heroTracks)
      .leftJoin(tracks, eq(heroTracks.trackId, tracks.id))
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(asc(heroTracks.position))
      .limit(5),
    db
      .select({
        ...trackCols,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(desc(tracks.plays))
      .limit(20),
    db
      .select({
        ...trackCols,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(desc(tracks.createdAt))
      .limit(20),
    db
      .select({
        id: artists.id,
        name: artists.name,
        slug: artists.slug,
        imageKey: artists.imageKey,
        imageUrl: artists.imageUrl,
      })
      .from(artists)
      .limit(40),
    db
      .select({
        id: albums.id,
        title: albums.title,
        coverKey: albums.coverKey,
        coverUrl: albums.coverUrl,
        releaseYear: albums.releaseYear,
        slug: albums.slug,
        artistName: artists.name,
      })
      .from(albums)
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .orderBy(desc(albums.releaseYear))
      .limit(20),
    db
      .select({
        id: playlists.id,
        name: playlists.name,
        coverKey: playlists.coverKey,
        coverUrl: playlists.coverUrl,
        category: playlists.category,
      })
      .from(playlists)
      .where(eq(playlists.isFeatured, true))
      .orderBy(desc(playlists.createdAt))
      .limit(20),
    db
      .select({
        id: albums.id,
        title: albums.title,
        coverKey: albums.coverKey,
        coverUrl: albums.coverUrl,
        releaseYear: albums.releaseYear,
        slug: albums.slug,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(albums)
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .where(eq(albums.isFeatured, true))
      .limit(1),
    db
      .select({
        id: tracks.id,
        title: tracks.title,
        audioKey: tracks.audioKey,
        coverKey: tracks.coverKey,
        duration: tracks.duration,
        slug: tracks.slug,
        featuredArtists: tracks.featuredArtists,
        artistId: tracks.artistId,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(desc(tracks.plays))
      .limit(20),
    db
      .select({
        id: tracks.id,
        title: tracks.title,
        audioKey: tracks.audioKey,
        coverKey: tracks.coverKey,
        slug: tracks.slug,
        artistId: tracks.artistId,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(desc(tracks.plays))
      .limit(200),
    db
      .select({ genre: tracks.genre })
      .from(tracks)
      .where(and(isNotNull(tracks.genre), ne(tracks.genre, ""), ne(tracks.genre, "null"), ne(tracks.genre, "false"))),
  ]);

  const heroTracksMapped = heroRes.map((r) => mapTrack(r));
  const trending = trendingRes.map(mapTrack);
  const latest = latestRes.map(mapTrack);

  const PRIORITY = ["Yo Maps", "Chile One", "Slapdee", "Chef 187", "Macky 2", "Kell Kay", "Dizmo", "Drifta Trek"];
  const artistsMapped = artistsRes
    .sort((a: any, b: any) => {
      const ai = PRIORITY.findIndex(p => a.name.toLowerCase().includes(p.toLowerCase()));
      const bi = PRIORITY.findIndex(p => b.name.toLowerCase().includes(p.toLowerCase()));
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 20)
    .map((a: any) => ({ id: a.id, name: a.name, slug: a.slug, coverUrl: getCoverUrl({ imageUrl: a.imageUrl, imageKey: a.imageKey }) }));

  const albumsMapped = albumsRes.map((a: any) => ({
    id: a.id, title: a.title, slug: a.slug,
    releaseYear: a.releaseYear ?? null,
    artistName: a.artistName ?? "Unknown",
    coverUrl: getCoverUrl({ coverUrl: a.coverUrl, coverKey: a.coverKey }),
  }));

  const playlistsMapped = playlistsRes.map((p: any) => ({
    id: p.id, name: p.name, category: p.category,
    coverUrl: getCoverUrl({ coverUrl: p.coverUrl, coverKey: p.coverKey }),
  }));

  const fa = featuredAlbumRes[0];
  const featuredAlbum = fa ? {
    id: fa.id, title: fa.title, slug: fa.slug,
    releaseYear: fa.releaseYear,
    artistName: fa.artistName ?? "Unknown",
    artistSlug: fa.artistSlug ?? null,
    coverUrl: getCoverUrl({ coverUrl: fa.coverUrl, coverKey: fa.coverKey }),
  } : null;

  const seenArtists = new Set<number>();
  const radioStations: RadioStation[] = [];
  for (const t of radioRes) {
    if (!t.artistId || seenArtists.has(t.artistId)) continue;
    seenArtists.add(t.artistId);
    radioStations.push({
      id: t.id,
      title: t.title,
      artist: t.artistName ?? "Unknown",
      artistSlug: t.artistSlug,
      coverUrl: getCoverUrl({ coverKey: t.coverKey }),
      slug: t.slug,
      name: t.artistName ?? "Unknown",
    });
    if (radioStations.length >= 10) break;
  }

  const genreCounts = new Map<string, { count: number; label: string }>();
  for (const r of genreRows) {
    const g = r.genre?.trim();
    if (!g || g === "" || g === "null" || g === "false") continue;
    const key = g.toLowerCase().replace(/[\s-]+/g, "");
    const existing = genreCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      genreCounts.set(key, { count: 1, label: g });
    }
  }
  const homeGenres = Array.from(genreCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((g) => g.label);

  return { heroTracks: heroTracksMapped, trending, latest, artists: artistsMapped, albums: albumsMapped, playlists: playlistsMapped, featuredAlbum, popularInZambia: popularRes.map(mapTrack), radioStations, homeGenres };
}

/* ─── Section Header ─────────────────────────────────────── */
function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <h2 className="text-xl md:text-[26px] font-black tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-[11px] font-bold text-foreground/35 hover:text-foreground transition-colors tracking-wider group">
          See All
          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const data = await getHomeData();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ZedBeatz",
      url: baseUrl,
      description: "Download latest Zambian music MP3. Stream Yo Maps, Chile One, Kell Kay new songs.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ZedBeatz",
      url: baseUrl,
      logo: `${baseUrl}/Logo.png`,
      description: "Zambian music streaming and download platform. Download latest Zambian music MP3 free.",
      foundingDate: "2024",
      areaServed: "ZM",
      sameAs: [
        "https://www.facebook.com/profile.php?id=61579237109236",
        "https://www.youtube.com/@zedbeatzm",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      name: "Featured Artists on ZedBeatz",
      description: "Browse popular Zambian artists including Yo Maps, Chile One, Kell Kay, Macky 2, Chef 187, Slapdee and more.",
      genre: "Zambian Music",
    },
  ];

  const heroTracks: Track[] = data ? (data.heroTracks.length > 0 ? data.heroTracks : data.latest.slice(0, 5)) : [];
  const trending: Track[] = data?.trending ?? [];
  const latest: Track[] = data?.latest ?? [];
  const artists: any[] = data?.artists ?? [];
  const albums: any[] = data?.albums ?? [];
  const playlists: any[] = data?.playlists ?? [];
  const featuredAlbum = data?.featuredAlbum ?? null;
  const popularInZambia: Track[] = data?.popularInZambia ?? [];
  const radioStations: RadioStation[] = data?.radioStations ?? [];
  const homeGenres: string[] = data?.homeGenres ?? [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative pb-6">
        <h1 className="sr-only">ZedBeatz - Zambian Music MP3 Download & Streaming</h1>
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="animate-ambient absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #1ed760 0%, transparent 70%)", animationDelay: "2s" }} />
          <div className="animate-ambient absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.03]"
            style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)", animationDelay: "7s" }} />
        </div>

        <HomeGreeting />

        {/* Continue Listening */}
        {/* Hero */}
        <div className="mt-4">
          <HeroSection tracks={heroTracks} featuredAlbum={featuredAlbum} />
        </div>

        {/* Continue Listening */}
        <div className="px-4 md:px-8">
          <ContinueListening />
        </div>

        {/* Trending */}
        {trending.length > 0 && (
          <section className="px-4 md:px-8 mb-10 md:mb-14">
            <SectionHeader title="Trending Now" href="/tracks" />
            <TrendingSection tracks={trending} />
          </section>
        )}

        {/* Recently Played */}
        <section className="px-4 md:px-8 mb-8 md:mb-10">
          <SectionHeader title="Recently Played" href="/library" />
          <Suspense fallback={<RecentlyPlayedSkeleton />}>
            <RecentlyPlayedSection />
          </Suspense>
        </section>

        {/* Popular in Zambia */}
        {popularInZambia.length > 0 && (
          <section className="mb-8 md:mb-10">
            <div className="px-4 md:px-8">
              <SectionHeader title="Popular in Zambia" href="/tracks" />
            </div>
            <ScrollRow>
              {popularInZambia.map((t) => (
                <div key={t.id} className="flex-shrink-0 w-[120px] md:w-[140px] snap-start">
                  <TrackCard track={t} queue={popularInZambia} bare minimal />
                </div>
              ))}
            </ScrollRow>
          </section>
        )}

        {/* Release Radar */}
        <ReleaseRadar />

        {/* New Releases */}
        {latest.length > 0 && (
          <section className="mb-8 md:mb-10">
            <div className="px-4 md:px-8">
              <SectionHeader title="New Releases" href="/tracks" />
            </div>
            <ScrollRow>
              {latest.map((t) => (
                <div key={t.id} className="flex-shrink-0 w-[140px] md:w-[176px] snap-start">
                  <TrackCard track={t} queue={latest} bare minimal />
                </div>
              ))}
            </ScrollRow>
          </section>
        )}

        {/* Genres & Moods */}
        <section className="px-4 md:px-8 mb-8 md:mb-10">
          <SectionHeader title="Genres & Moods" />
          <GenresMoods genres={homeGenres} />
        </section>

        {/* Radio Stations */}
        {radioStations.length > 0 && (
          <section className="mb-8 md:mb-10">
            <div className="px-4 md:px-8">
              <SectionHeader title="Radio Stations" />
            </div>
            <ScrollRow>
              <RadioStations stations={radioStations} />
            </ScrollRow>
          </section>
        )}

        {/* Featured Artists */}
        {artists.length > 0 && (
          <section className="mb-8 md:mb-10">
            <div className="px-4 md:px-8">
              <SectionHeader title="Featured Artists" href="/browse" />
            </div>
            <ScrollRow>
              {artists.map((artist) => (
                <Link key={artist.id} href={`/artist/${artist.slug || artist.id}`}
                  className="group flex flex-col items-center gap-2.5 shrink-0 snap-start w-[100px] md:w-[120px]">
                  <div className="relative w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden bg-[var(--surface-3)] shadow-lg ring-1 ring-white/[0.04] transition-transform duration-300 group-hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] -z-10" />
                    {artist.coverUrl && <Image src={artist.coverUrl} alt={artist.name} fill className="object-cover" unoptimized />}
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-center leading-tight w-full truncate group-hover:text-[var(--primary)] transition-colors duration-200">
                    {artist.name}
                  </p>
                </Link>
              ))}
            </ScrollRow>
          </section>
        )}

        {/* Albums */}
        {albums.length > 0 && (
          <section className="mb-8 md:mb-10">
            <div className="px-4 md:px-8">
              <SectionHeader title="Albums" href="/browse" />
            </div>
            <ScrollRow>
              {albums.map((album) => (
                <Link key={album.id} href={`/album/${album.slug || album.id}`} className="group flex-shrink-0 w-[140px] md:w-[176px] snap-start">
                  <div className="relative w-full aspect-square overflow-hidden bg-[var(--surface-3)] mb-2.5 shadow-lg ring-1 ring-white/5 group-hover:ring-[var(--primary)]/40 transition-all duration-400 rounded-lg">
                    {album.coverUrl && <Image src={album.coverUrl} alt={album.title} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-600" unoptimized />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {album.releaseYear && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-background/70 text-[10px] font-semibold text-foreground/80">{album.releaseYear}</div>
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
              <SectionHeader title="Playlists" />
            </div>
            <ScrollRow>
              {playlists.map((playlist) => (
                <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="group flex-shrink-0 w-[140px] md:w-[176px] snap-start">
                  <div className="relative w-full aspect-square overflow-hidden bg-[var(--surface-3)] mb-2.5 shadow-lg ring-1 ring-white/5 group-hover:ring-[var(--primary)]/40 transition-all duration-400 rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center -z-10" />
                    {playlist.coverUrl && <Image src={playlist.coverUrl} alt={playlist.name} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-600" unoptimized />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <p className="text-xs md:text-sm font-bold truncate group-hover:text-[var(--primary)] transition-colors">{playlist.name}</p>
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
