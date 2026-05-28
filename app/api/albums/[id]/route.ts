import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { albums, artists, tracks } from "@/lib/db/schema";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { eq, asc } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isNumeric = /^\d+$/.test(id);

  const [albumData] = isNumeric
    ? await db
        .select({
          id: albums.id,
          title: albums.title,
          slug: albums.slug,
          coverKey: albums.coverKey,
          releaseYear: albums.releaseYear,
          artistId: albums.artistId,
          artistName: artists.name,
          artistSlug: artists.slug,
        })
        .from(albums)
        .leftJoin(artists, eq(albums.artistId, artists.id))
        .where(eq(albums.id, parseInt(id)))
        .limit(1)
    : await db
        .select({
          id: albums.id,
          title: albums.title,
          slug: albums.slug,
          coverKey: albums.coverKey,
          releaseYear: albums.releaseYear,
          artistId: albums.artistId,
          artistName: artists.name,
          artistSlug: artists.slug,
        })
        .from(albums)
        .leftJoin(artists, eq(albums.artistId, artists.id))
        .where(eq(albums.slug, id))
        .limit(1);

  if (!albumData) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  let trackRows = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      duration: tracks.duration,
      featuredArtists: tracks.featuredArtists,
      plays: tracks.plays,
      slug: tracks.slug,
      artistId: tracks.artistId,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(eq(tracks.albumId, albumData.id))
    .orderBy(asc(tracks.createdAt));

  if (trackRows.length === 0 && albumData.artistId) {
    trackRows = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        audioKey: tracks.audioKey,
        coverKey: tracks.coverKey,
        duration: tracks.duration,
        featuredArtists: tracks.featuredArtists,
        plays: tracks.plays,
        slug: tracks.slug,
        artistId: tracks.artistId,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .where(eq(tracks.artistId, albumData.artistId))
      .limit(50);
  }

  const album = {
    id: albumData.id,
    title: albumData.title,
    slug: albumData.slug,
    artist: albumData.artistName ?? "Unknown",
    artistSlug: albumData.artistSlug,
    coverUrl: albumData.coverKey ? getPublicUrl(albumData.coverKey) : null,
    releaseYear: albumData.releaseYear,
    trackCount: trackRows.length,
  };

  const tracksResult = trackRows.map((r) => ({
    id: r.id,
    title: r.title,
    artist: r.artistName ?? "Unknown",
    artistId: r.artistId,
    artistSlug: r.artistSlug,
    featuredArtists: sanitizeFeaturedArtists(r.featuredArtists),
    audioUrl: getPublicUrl(r.audioKey),
    coverUrl: r.coverKey ? getPublicUrl(r.coverKey) : null,
    duration: r.duration,
    slug: r.slug,
    plays: r.plays,
  }));

  return NextResponse.json({ album, tracks: tracksResult });
}
