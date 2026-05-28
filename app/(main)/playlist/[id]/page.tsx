import { db } from "@/lib/db/drizzle";
import { playlists, playlistTracks, tracks, artists } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlaylistPageClient from "./client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const isNumeric = !isNaN(Number(id));
  if (!isNumeric) return {};
  const [playlist] = await db
    .select({ name: playlists.name, category: playlists.category })
    .from(playlists)
    .where(eq(playlists.id, Number(id)))
    .limit(1);
  if (!playlist) return {};
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";
  const category = playlist.category || "Zambian Music";
  return {
    title: `${playlist.name} - ${category} Playlist | ZedBeatz`,
    description: `Listen to ${playlist.name} - a curated ${category} playlist on ZedBeatz. Stream and download Zambian music MP3 free.`,
    keywords: [
      playlist.name, category, `${playlist.name} playlist`, `${playlist.name} Zambian music`,
      `${category} playlist`, "Zambian music playlist",
      "Zambian music streaming", "free Zambian music", "Zambia songs download",
      "listen to Zambian music online", "new Zambian songs today", "Zambian music 2026 hits",
      "top Zambian songs", "Zambian music charts", "Kopala music", "Zambian artists list",
      "Kalindula music", "Zamdancehall", "Zambian hip hop", "Zambian gospel music",
      "Zambian Afrobeat", "Lusaka music", "Copperbelt music", "Ndola music",
      "Zambian music platform", "best Zambian music site", "Zambia mp3 streaming",
      "Zambian music online", "Zambian songs mp3", "Zambia urban music",
      "Zambian dancehall", "Zambian R&B", "Zambian traditional music",
      "Zambian music video", "Zambian music 2026 playlist", "ZedBeatz Zambian music",
      "Zambian music download mp3 2026", "Zambian music audio", "listen to Zambian music",
    ],
    openGraph: {
      title: `${playlist.name} - ${category} Playlist`,
      description: `Listen to ${playlist.name} on ZedBeatz. Curated ${category} playlist.`,
      url: `${baseUrl}/playlist/${id}`,
      siteName: "ZedBeatz",
      type: "music.playlist",
    },
    twitter: {
      card: "summary_large_image",
      title: `${playlist.name} - ${category} Playlist | ZedBeatz`,
      description: `Listen to ${playlist.name} on ZedBeatz. Curated ${category} playlist.`,
    },
  };
}

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [playlistResult, countResult, trackRows] = await Promise.all([
    db
      .select({
        id: playlists.id,
        name: playlists.name,
        coverKey: playlists.coverKey,
        isFeatured: playlists.isFeatured,
        category: playlists.category,
      })
      .from(playlists)
      .where(eq(playlists.id, Number(id)))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, Number(id)))
      .then((r) => r[0]?.count ?? 0),
    db
      .select({
        position: playlistTracks.position,
        trackId: tracks.id,
        trackTitle: tracks.title,
        audioKey: tracks.audioKey,
        coverKey: tracks.coverKey,
        duration: tracks.duration,
        slug: tracks.slug,
        featuredArtists: tracks.featuredArtists,
        artistId: artists.id,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(playlistTracks)
      .leftJoin(tracks, eq(playlistTracks.trackId, tracks.id))
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .where(eq(playlistTracks.playlistId, Number(id)))
      .orderBy(playlistTracks.position),
  ]);

  if (!playlistResult) notFound();

  const playlist = {
    id: playlistResult.id,
    name: playlistResult.name,
    cover_key: playlistResult.coverKey,
    is_featured: playlistResult.isFeatured,
    category: playlistResult.category,
    playlist_tracks: [{ count: countResult }],
  };

  const trackData = trackRows.map((r) => ({
    position: r.position,
    tracks: {
      id: r.trackId,
      title: r.trackTitle,
      audio_key: r.audioKey,
      cover_key: r.coverKey,
      duration: r.duration ? Number(r.duration) : null,
      slug: r.slug,
      featured_artists: r.featuredArtists,
      artists: r.artistId ? { id: r.artistId, name: r.artistName, slug: r.artistSlug } : null,
    },
  }));

  const tracksMapped = (trackData ?? []).map(({ tracks: t }: any) => ({
    id: t.id,
    title: t.title,
    artist: t.artists?.name ?? "Unknown",
    artistId: t.artists?.id,
    artistSlug: t.artists?.slug,
    featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
    slug: t.slug,
    audioUrl: getPublicUrl(t.audio_key),
    coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : undefined,
    duration: t.duration,
  }));

  const firstCover = tracksMapped.find(t => t.coverUrl)?.coverUrl ?? null;
  const coverUrl = playlist.cover_key ? getPublicUrl(playlist.cover_key) : firstCover;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    name: playlist.name,
    description: `${playlist.name} - ${playlist.category || "Zambian Music"} playlist on ZedBeatz. ${tracksMapped.length} tracks.`,
    numTracks: tracksMapped.length,
    url: `${baseUrl}/playlist/${playlist.id}`,
    ...(coverUrl && { image: coverUrl }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PlaylistPageClient playlist={{ ...playlist, coverUrl }} tracks={tracksMapped} />
    </>
  );
}
