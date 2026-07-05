import { db } from "@/lib/db/drizzle";
import { recentlyPlayed, tracks, artists } from "@/lib/db/schema";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ tracks: [] });
  }

  const data = await db
    .select({
      trackId: recentlyPlayed.trackId,
      playedAt: recentlyPlayed.playedAt,
      trackId2: tracks.id,
      trackTitle: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      duration: tracks.duration,
      trackSlug: tracks.slug,
      featuredArtists: tracks.featuredArtists,
      artistId: tracks.artistId,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(recentlyPlayed)
    .leftJoin(tracks, eq(recentlyPlayed.trackId, tracks.id))
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(eq(recentlyPlayed.userId, userId))
    .orderBy(desc(recentlyPlayed.playedAt))
    .limit(50);

  const seen = new Set<number>();
  const tracks_result = data
    .filter((r) => {
      if (!r.trackId2 || !r.trackId || seen.has(r.trackId)) return false;
      seen.add(r.trackId);
      return true;
    })
    .slice(0, 12)
    .map((r) => ({
      id: r.trackId2,
      title: r.trackTitle,
      artistId: r.artistId,
      artist: r.artistName ?? "Unknown",
      artistSlug: r.artistSlug,
      featuredArtists: sanitizeFeaturedArtists(r.featuredArtists),
      audioUrl: getAudioUrl({ audioKey: r.audioKey }) ?? "",
      coverUrl: getCoverUrl({ coverKey: r.coverKey }),
      duration: r.duration,
      slug: r.trackSlug,
      playedAt: r.playedAt,
    }));

  return NextResponse.json({ tracks: tracks_result });
}
