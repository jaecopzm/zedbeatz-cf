import { db } from "@/lib/db/drizzle";
import { tracks, artists } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import SectionHeader from "@/components/section-header";
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
    <div className="pb-8 space-y-7 md:space-y-9">
      {/* Header */}
      <section className="px-4 md:px-8 pt-4 md:pt-5">
        <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)] mb-1">
          Browse
        </p>
        <h1 className="font-display text-2xl md:text-[32px] font-bold tracking-tight leading-tight">Discover</h1>
        <p className="text-[13px] md:text-sm text-[var(--muted)] mt-1">
          Charts, new releases and every genre.
        </p>
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
