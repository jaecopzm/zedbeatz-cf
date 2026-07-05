import { db } from "@/lib/db/drizzle";
import { tracks, artists } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import TopCharts from "@/components/browse/top-charts";
import NewReleases from "@/components/browse/new-releases";
import GenreGrid from "@/components/browse/genre-grid";
import FeaturedPlaylists from "@/components/browse/featured-playlists";
import ScrollRow from "@/components/home/scroll-row";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover — ZedBeatz",
  description: "Browse top charts, new releases, genres, and featured playlists on ZedBeatz.",
};

const GENRES = [
  "Afrobeats", "Hip Hop", "Gospel", "R&B", "Dancehall", "Drill",
  "Bongo", "Amapiano", "Praise", "Kalindula", "Reggae", "Pop",
];

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

export default async function BrowsePage() {
  const [topTracksData, latestTracksData] = await Promise.all([
    db
      .select({
        id: tracks.id, title: tracks.title, slug: tracks.slug,
        coverKey: tracks.coverKey, coverUrl: tracks.coverUrl,
        audioKey: tracks.audioKey,
        duration: tracks.duration, artistId: tracks.artistId,
        artistName: artists.name, artistSlug: artists.slug,
        featuredArtists: tracks.featuredArtists,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(desc(tracks.plays))
      .limit(10),
    db
      .select({
        id: tracks.id, title: tracks.title, slug: tracks.slug,
        coverKey: tracks.coverKey, coverUrl: tracks.coverUrl,
        audioKey: tracks.audioKey,
        duration: tracks.duration, artistId: tracks.artistId,
        artistName: artists.name, artistSlug: artists.slug,
        featuredArtists: tracks.featuredArtists,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(desc(tracks.createdAt))
      .limit(12),
  ]);

  const mapTrack = (t: typeof topTracksData[0]): Track => ({
    id: t.id, title: t.title, slug: t.slug ?? undefined,
    coverUrl: getCoverUrl({ coverKey: t.coverKey, coverUrl: t.coverUrl }) ?? undefined,
    audioUrl: getAudioUrl({ audioKey: t.audioKey }) ?? "",
    duration: t.duration ? Number(t.duration) : undefined,
    artist: t.artistName ?? "Unknown",
    artistSlug: t.artistSlug ?? undefined,
    artistId: t.artistId ?? undefined,
    featuredArtists: t.featuredArtists ?? undefined,
  });

  const topTracks = topTracksData.map(mapTrack);
  const latestTracks = latestTracksData.map(mapTrack);

  return (
    <div className="pb-32 space-y-8 md:space-y-10">
      {/* Hero banner */}
      <section className="px-4 md:px-8 pt-4">
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1ed760]/20 via-[#1ed760]/5 to-background border border-[var(--border)] p-6 md:p-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Discover</h1>
          <p className="text-sm md:text-base text-foreground/60 max-w-md">
            Explore top charts, new releases, and music across every genre.
          </p>
        </div>
      </section>

      {/* Top Charts */}
      {topTracks.length > 0 && (
        <section className="px-4 md:px-8">
          <SectionHeader title="Top Charts" href="/tracks" />
          <TopCharts tracks={topTracks} />
        </section>
      )}

      {/* New Releases */}
      {latestTracks.length > 0 && (
        <section className="px-4 md:px-8">
          <SectionHeader title="New Releases" />
          <NewReleases tracks={latestTracks} />
        </section>
      )}

      {/* Genres */}
      <section className="px-4 md:px-8">
        <SectionHeader title="Browse by Genre" />
        <GenreGrid genres={GENRES} />
      </section>

      {/* Featured Playlists */}
      <section className="px-4 md:px-8">
        <SectionHeader title="Featured Playlists" />
        <FeaturedPlaylists />
      </section>
    </div>
  );
}
