import { db } from "@/lib/db/drizzle";
import { tracks } from "@/lib/db/schema/tracks";
import { artists } from "@/lib/db/schema/artists";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";
import { ilike, desc, eq, and } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 100;
  const search = req.nextUrl.searchParams.get("search");
  const sort = req.nextUrl.searchParams.get("sort");

  const conditions = [];

  if (search) {
    conditions.push(ilike(tracks.title, `%${search}%`));
  }

  const orderBy = sort === "trending"
    ? desc(tracks.plays)
    : desc(tracks.createdAt);

  const data = await db
    .select()
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit);

  const result = data.map(({ tracks: t, artists: a }) => ({
    id: t.id,
    title: t.title,
    artist: a?.name ?? "Unknown",
    artistId: t.artistId,
    artistSlug: a?.slug,
    featuredArtists: sanitizeFeaturedArtists(t.featuredArtists),
    audioUrl: getPublicUrl(t.audioKey),
    coverUrl: t.coverKey ? getPublicUrl(t.coverKey) : null,
    duration: t.duration ? Number(t.duration) : null,
    slug: t.slug,
    plays: t.plays,
    genre: t.genre,
  }));

  return NextResponse.json(result);
}
