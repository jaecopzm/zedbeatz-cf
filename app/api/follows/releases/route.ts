import { db } from "@/lib/db/drizzle";
import { follows, tracks, artists } from "@/lib/db/schema";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ tracks: [] });
  }

  const followedArtists = await db
    .select({ artistId: follows.artistId })
    .from(follows)
    .where(eq(follows.userId, userId));

  if (followedArtists.length === 0) {
    return NextResponse.json({ tracks: [] });
  }

  const artistIds = followedArtists.map((f) => f.artistId);

  const trackList = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      duration: tracks.duration,
      artistId: tracks.artistId,
      slug: tracks.slug,
      featuredArtists: tracks.featuredArtists,
      createdAt: tracks.createdAt,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(inArray(tracks.artistId, artistIds))
    .orderBy(desc(tracks.createdAt))
    .limit(20);

  const mapped = trackList.map((t) => ({
    id: t.id,
    title: t.title,
    artistId: t.artistId,
    artist: t.artistName ?? "Unknown",
    artistSlug: t.artistSlug,
    featuredArtists: sanitizeFeaturedArtists(t.featuredArtists),
    audioUrl: getPublicUrl(t.audioKey),
    coverUrl: t.coverKey ? getPublicUrl(t.coverKey) : null,
    duration: t.duration,
    slug: t.slug,
    createdAt: t.createdAt,
  }));

  return NextResponse.json({ tracks: mapped });
}
