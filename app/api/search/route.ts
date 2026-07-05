import { db } from "@/lib/db/drizzle";
import { tracks, artists, albums } from "@/lib/db/schema";
import { getCoverUrl, getAudioUrl } from "@/lib/cdn";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { ilike, eq, inArray, desc, and, isNotNull, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ tracks: [], artists: [], albums: [], genres: [] });

  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const searchPattern = `%${words.join('%')}%`;

  // Per-word patterns for cross-field matching
  const wordPatterns = words.map(w => `%${w}%`);

  const [tracksByTitle, artistsResult, albumsResult, genreTracks, tracksByGenre] = await Promise.all([
    db
      .select({
        id: tracks.id,
        title: tracks.title,
        audioKey: tracks.audioKey,
        coverKey: tracks.coverKey,
        coverUrl: tracks.coverUrl,
        isrc: tracks.isrc,
        duration: tracks.duration,
        artistId: tracks.artistId,
        slug: tracks.slug,
        featuredArtists: tracks.featuredArtists,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .where(
        // Match if ANY word appears in title, artist name, or featured artists
        sql`(
          ${ilike(tracks.title, searchPattern)}
          OR ${ilike(artists.name, searchPattern)}
          OR ${ilike(tracks.featuredArtists, searchPattern)}
          OR (${wordPatterns.map(p => sql`(
            ${ilike(tracks.title, p)}
            OR ${ilike(artists.name, p)}
            OR ${ilike(tracks.featuredArtists, p)}
          )`).reduce((a, b) => sql`${a} AND ${b}`)})
        )`
      )
      .orderBy(desc(tracks.plays))
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
      .where(ilike(artists.name, searchPattern))
      .limit(8),
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
      .where(ilike(albums.title, searchPattern))
      .limit(8),
    db
      .select({ genre: tracks.genre })
      .from(tracks)
      .where(and(isNotNull(tracks.genre), ilike(tracks.genre, searchPattern)))
      .limit(10),
    db
      .select({
        id: tracks.id,
        title: tracks.title,
        audioKey: tracks.audioKey,
        coverKey: tracks.coverKey,
        coverUrl: tracks.coverUrl,
        isrc: tracks.isrc,
        duration: tracks.duration,
        artistId: tracks.artistId,
        slug: tracks.slug,
        featuredArtists: tracks.featuredArtists,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .where(ilike(tracks.genre, `%${q}%`))
      .orderBy(desc(tracks.plays))
      .limit(30),
  ]);

  const artistIds = artistsResult.map((a) => a.id);
  let tracksByArtist: typeof tracksByTitle = [];
  if (artistIds.length > 0) {
    tracksByArtist = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        audioKey: tracks.audioKey,
        coverKey: tracks.coverKey,
        coverUrl: tracks.coverUrl,
        isrc: tracks.isrc,
        duration: tracks.duration,
        artistId: tracks.artistId,
        slug: tracks.slug,
        featuredArtists: tracks.featuredArtists,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .where(inArray(tracks.artistId, artistIds))
      .limit(15);
  }

  const seen = new Set<number>();
  const allTracks = [...tracksByArtist, ...tracksByTitle, ...tracksByGenre].filter((t) => {
    if (!t.id || seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  }).slice(0, 30);

  const genres = Array.from(new Set(genreTracks.map((t) => t.genre).filter(Boolean))) as string[];

  return NextResponse.json({
    tracks: allTracks.map((t) => ({
      id: t.id,
      title: t.title,
      artistId: t.artistId,
      artist: t.artistName ?? "Unknown",
      artistSlug: t.artistSlug,
      featuredArtists: sanitizeFeaturedArtists(t.featuredArtists),
      audioUrl: getAudioUrl({ audioKey: t.audioKey, isrc: t.isrc }) ?? "",
      coverUrl: getCoverUrl({ coverKey: t.coverKey, coverUrl: t.coverUrl }),
      duration: t.duration,
      slug: t.slug,
    })),
    artists: artistsResult.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      imageUrl: getCoverUrl({ imageKey: a.imageKey, imageUrl: a.imageUrl }),
    })),
    albums: albumsResult.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      releaseYear: a.releaseYear,
      coverUrl: getCoverUrl({ coverKey: a.coverKey, coverUrl: a.coverUrl }),
      artistName: a.artistName ?? "Unknown",
      artistSlug: a.artistSlug,
    })),
    genres: genres.slice(0, 6),
  });
}
