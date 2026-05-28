import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { artists, tracks } from "@/lib/db/schema";
import { getPublicUrl } from "@/lib/r2";
import { eq, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isNumeric = /^\d+$/.test(id);

  const [artist] = isNumeric
    ? await db
        .select({
          id: artists.id,
          name: artists.name,
          slug: artists.slug,
          bio: artists.bio,
          imageKey: artists.imageKey,
        })
        .from(artists)
        .where(eq(artists.id, Number(id)))
        .limit(1)
    : await db
        .select({
          id: artists.id,
          name: artists.name,
          slug: artists.slug,
          bio: artists.bio,
          imageKey: artists.imageKey,
        })
        .from(artists)
        .where(eq(artists.slug, id))
        .limit(1);

  if (!artist) {
    return NextResponse.json({ error: "Artist not found" }, { status: 404 });
  }

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
      plays: tracks.plays,
      createdAt: tracks.createdAt,
    })
    .from(tracks)
    .where(eq(tracks.artistId, artist.id))
    .orderBy(desc(tracks.plays));

  return NextResponse.json({
    artist: {
      ...artist,
      imageUrl: artist.imageKey ? getPublicUrl(artist.imageKey) : null,
    },
    tracks: trackList.map(t => ({
      ...t,
      coverUrl: t.coverKey ? getPublicUrl(t.coverKey) : null,
      audioUrl: getPublicUrl(t.audioKey),
    })),
  });
}
