import { db } from "@/lib/db/drizzle";
import { playlists, playlistTracks, tracks, artists } from "@/lib/db/schema";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playlistId = Number(id);

  const data = await db
    .select({
      position: playlistTracks.position,
      trackId: tracks.id,
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
    .from(playlistTracks)
    .leftJoin(tracks, eq(playlistTracks.trackId, tracks.id))
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(eq(playlistTracks.playlistId, playlistId))
    .orderBy(asc(playlistTracks.position));

  const tracksResult = data.flatMap((r) => {
    if (!r.trackId) return [];
    return {
      id: r.trackId,
      title: r.title,
      artist: r.artistName ?? "Unknown",
      artistId: r.artistId ?? undefined,
      artistSlug: r.artistSlug ?? undefined,
      featuredArtists: sanitizeFeaturedArtists(r.featuredArtists),
      audioUrl: getAudioUrl({ audioKey: r.audioKey }) ?? "",
      coverUrl: getCoverUrl({ coverKey: r.coverKey }),
      duration: r.duration,
      slug: r.slug ?? undefined,
    };
  });

  return NextResponse.json(tracksResult);
}

export async function POST() {
  return NextResponse.json({ error: "Playlist editing is paused" }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Playlist editing is paused" }, { status: 410 });
}
