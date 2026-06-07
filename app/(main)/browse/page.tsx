import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db/drizzle";
import { tracks, artists } from "@/lib/db/schema";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import GenreGrid from "@/components/browse/genre-grid";
import FeaturedPlaylists from "@/components/browse/featured-playlists";
import NewReleases from "@/components/browse/new-releases";
import TopCharts from "@/components/browse/top-charts";

export const metadata: Metadata = {
  title: "Browse Zambian Music by Genre, Charts & Playlists",
  description: "Discover Zambian music by genre, top charts, curated playlists, and new releases. Browse Yo Maps, Chile One, Macky 2, and more Zambian artists. MP3 download and streaming.",
  keywords: [
    "Zambian music", "browse music", "Zambian genres", "Zambian music charts",
    "top Zambian songs", "Zambian playlists", "new Zambian music",
    "ZedBeatz", "Zambia music 2026", "Zambian music streaming", "free Zambian music download"
  ],
  openGraph: {
    title: "Browse Zambian Music - Genres, Charts & Playlists | ZedBeatz",
    description: "Discover and download Zambian music by genre, top charts, and curated playlists on ZedBeatz.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Zambian Music - Genres, Charts & Playlists | ZedBeatz",
    description: "Discover Zambian music by genre, top charts, and curated playlists on ZedBeatz. MP3 download and streaming.",
  },
};

function mapTrack(r: any): Track {
  return {
    id: r.id, title: r.title,
    artistId: r.artistId ?? undefined,
    artist: r.artistName ?? "Unknown",
    artistSlug: r.artistSlug,
    featuredArtists: sanitizeFeaturedArtists(r.featuredArtists),
    audioUrl: getPublicUrl(r.audioKey),
    coverUrl: r.coverKey ? getPublicUrl(r.coverKey) : undefined,
    duration: r.duration ? Number(r.duration) : undefined,
    slug: r.slug ?? undefined,
  };
}

async function getBrowseData() {
  const rawTracks = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      duration: tracks.duration,
      artistId: tracks.artistId,
      slug: tracks.slug,
      featuredArtists: tracks.featuredArtists,
      plays: tracks.plays,
      genre: tracks.genre,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .orderBy(desc(tracks.createdAt))
    .limit(50);

  const tracksMapped: Track[] = rawTracks.map(mapTrack);
  const genres = Array.from(new Set(rawTracks.map((t) => t.genre).filter(Boolean))) as string[];
  const plays: Record<number, number> = Object.fromEntries(rawTracks.map((t) => [t.id, t.plays ?? 0]));

  return { tracks: tracksMapped, genres, plays };
}

export default async function BrowsePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const { tracks: tracksData, genres, plays } = await getBrowseData();
  const topTracks = [...tracksData].sort((a, b) => (plays[b.id] ?? 0) - (plays[a.id] ?? 0));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
            { "@type": "ListItem", position: 2, name: "Browse", item: `${baseUrl}/browse` },
          ],
        })
      }} />
      <div className="pb-6">
      {/* Genres */}
      <section className="px-4 md:px-8 mb-8 md:mb-12">
        <h2 className="text-xl md:text-[26px] font-black tracking-tight mb-3 md:mb-4">Browse by Genre</h2>
        <GenreGrid genres={genres} />
      </section>

      {/* Top Charts */}
      <section className="px-4 md:px-8 mb-8 md:mb-12">
        <h2 className="text-xl md:text-[26px] font-black tracking-tight mb-3 md:mb-4">Top Charts</h2>
        <TopCharts tracks={topTracks} />
      </section>

      {/* Curated Playlists */}
      <section className="mb-8 md:mb-12">
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-xl md:text-[26px] font-black tracking-tight">Curated Playlists</h2>
            <Link href="/library" className="group flex items-center gap-1 text-[10px] md:text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition-all">
              See all <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
        <FeaturedPlaylists />
      </section>

      {/* New Releases */}
      <section className="mb-8 md:mb-12">
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-xl md:text-[26px] font-black tracking-tight">New Releases</h2>
            <Link href="/tracks" className="group flex items-center gap-1 text-[10px] md:text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition-all">
              Show all <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
        <NewReleases tracks={tracksData.slice(0, 12)} />
      </section>
    </div>
    </>
  );
}
