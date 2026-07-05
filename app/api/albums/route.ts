import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { albums, artists, tracks } from "@/lib/db/schema";
import { getCoverUrl } from "@/lib/cdn";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  const data = await db
    .select({
      id: albums.id,
      title: albums.title,
      slug: albums.slug,
      coverKey: albums.coverKey,
      releaseYear: albums.releaseYear,
      artistId: albums.artistId,
      artistName: artists.name,
      artistSlug: artists.slug,
      trackCount: sql<number>`count(${tracks.id})`.as("track_count"),
    })
    .from(albums)
    .leftJoin(artists, eq(albums.artistId, artists.id))
    .leftJoin(tracks, eq(tracks.albumId, albums.id))
    .groupBy(albums.id, artists.name, artists.slug)
    .orderBy(desc(albums.releaseYear))
    .limit(limit)
    .offset(offset);

  const result = data.map((album) => ({
    id: album.id,
    title: album.title,
    slug: album.slug,
    artist: album.artistName ?? "Unknown",
    artistSlug: album.artistSlug,
    coverUrl: getCoverUrl({ coverKey: album.coverKey }),
    releaseYear: album.releaseYear,
    trackCount: Number(album.trackCount),
  }));

  return NextResponse.json(result);
}
