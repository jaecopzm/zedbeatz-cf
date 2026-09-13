import { db } from "@/lib/db/drizzle";
import { playlists, playlistTracks, tracks, artists } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import PlaylistPageClient from "./client";
import { encodeId, decodeId } from "@/lib/hashids";

function resolvePlaylistId(param: string): number | null {
  if (/^\d+$/.test(param)) return Number(param);
  const dec = decodeId(param);
  return dec;
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const numericId = resolvePlaylistId(id);
  if (numericId === null) return {};
  const [playlist] = await db
    .select({ name: playlists.name, category: playlists.category })
    .from(playlists)
    .where(eq(playlists.id, numericId))
    .limit(1);
  if (!playlist) return {};
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const category = playlist.category || "Zambian Music";
  const hid = encodeId(numericId);
  return {
    title: `${playlist.name} - ${category} Playlist | ZedBeatz`,
    description: `Listen to ${playlist.name} - a curated ${category} playlist on ZedBeatz. Stream and download Zambian music MP3 free.`,
    keywords: [
      playlist.name, category, `${playlist.name} playlist`, `${playlist.name} Zambian music`,
      `${category} playlist`, "Zambian music playlist",
      "Zambian music streaming", "free Zambian music download", "ZedBeatz Zambian music"
    ],
    openGraph: {
      title: `${playlist.name} - ${category} Playlist`,
      description: `Listen to ${playlist.name} on ZedBeatz. Curated ${category} playlist.`,
      url: `${baseUrl}/playlist/${hid}`,
      siteName: "ZedBeatz",
      type: "music.playlist",
    },
    twitter: {
      card: "summary_large_image",
      title: `${playlist.name} - ${category} Playlist | ZedBeatz`,
      description: `Listen to ${playlist.name} on ZedBeatz. Curated ${category} playlist.`,
    },
    alternates: { canonical: `${baseUrl}/playlist/${hid}` },
  };
}

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = resolvePlaylistId(id);
  if (numericId === null) notFound();
  // 301 numeric/slug to hashid
  const hidCheck = encodeId(numericId);
  if (id !== hidCheck) permanentRedirect(`/playlist/${hidCheck}`);

  const [playlistResult, countResult, trackRows] = await Promise.all([
    db
      .select({
        id: playlists.id,
        name: playlists.name,
        coverKey: playlists.coverKey,
        coverUrl: playlists.coverUrl,
        isFeatured: playlists.isFeatured,
        category: playlists.category,
      })
      .from(playlists)
      .where(eq(playlists.id, numericId))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, numericId))
      .then((r) => r[0]?.count ?? 0),
    db
      .select({
        position: playlistTracks.position,
        trackId: tracks.id,
        trackTitle: tracks.title,
        audioKey: tracks.audioKey,
        coverKey: tracks.coverKey,
        coverUrl: tracks.coverUrl,
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
      .where(eq(playlistTracks.playlistId, numericId))
      .orderBy(playlistTracks.position),
  ]);

  if (!playlistResult) notFound();

  const playlist = {
    id: playlistResult.id,
    name: playlistResult.name,
    cover_key: playlistResult.coverKey,
    cover_url: playlistResult.coverUrl,
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
      cover_url: r.coverUrl,
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
    audioUrl: getAudioUrl({ audioKey: t.audio_key }) ?? "",
    coverUrl: getCoverUrl({ coverKey: t.cover_key, coverUrl: t.cover_url }) ?? undefined,
    duration: t.duration,
  }));

  const firstCover = tracksMapped.find(t => t.coverUrl)?.coverUrl ?? null;
  const coverUrl = getCoverUrl({ coverKey: playlist.cover_key, coverUrl: playlist.cover_url }) ?? firstCover;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    name: playlist.name,
    description: `${playlist.name} - ${playlist.category || "Zambian Music"} playlist on ZedBeatz. ${tracksMapped.length} tracks.`,
    numTracks: tracksMapped.length,
    url: `${baseUrl}/playlist/${encodeId(playlist.id)}`,
    ...(coverUrl && { image: coverUrl }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PlaylistPageClient playlist={{ ...playlist, coverUrl }} tracks={tracksMapped} />
    </>
  );
}
