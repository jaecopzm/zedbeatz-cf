import { db } from "@/lib/db/drizzle";
import { heroTracks, tracks, artists } from "@/lib/db/schema";
import { getPublicUrl } from "@/lib/r2";
import { NextResponse } from "next/server";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { eq, asc } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const data = await db
    .select({
      trackId: heroTracks.trackId,
      position: heroTracks.position,
      trackId2: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      duration: tracks.duration,
      slug: tracks.slug,
      featuredArtists: tracks.featuredArtists,
      artistId: tracks.artistId,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(heroTracks)
    .leftJoin(tracks, eq(heroTracks.trackId, tracks.id))
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .orderBy(asc(heroTracks.position));

  const mapped = data.map((r) => ({
    id: r.trackId2,
    title: r.title,
    artistId: r.artistId,
    artist: r.artistName ?? "Unknown",
    artistSlug: r.artistSlug,
    featuredArtists: sanitizeFeaturedArtists(r.featuredArtists),
    audioUrl: r.audioKey ? getPublicUrl(r.audioKey) : "",
    coverUrl: r.coverKey ? getPublicUrl(r.coverKey) : null,
    duration: r.duration,
    slug: r.slug,
  }));

  return NextResponse.json(mapped);
}
