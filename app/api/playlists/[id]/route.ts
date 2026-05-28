import { db } from "@/lib/db/drizzle";
import { playlists, playlistTracks, tracks, artists } from "@/lib/db/schema";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and, asc, sql } from "drizzle-orm";

async function getAccessiblePlaylist(id: number, userId: string | null) {
  const [data] = await db
    .select({ id: playlists.id, userId: playlists.userId })
    .from(playlists)
    .where(eq(playlists.id, id))
    .limit(1);

  if (!data) {
    return { error: NextResponse.json({ error: "Playlist not found" }, { status: 404 }) };
  }

  if (data.userId && data.userId !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { playlist: data };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  const playlistId = Number(id);
  const access = await getAccessiblePlaylist(playlistId, userId);
  if (access.error) return access.error;

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
      audioUrl: r.audioKey ? getPublicUrl(r.audioKey) : "",
      coverUrl: r.coverKey ? getPublicUrl(r.coverKey) : null,
      duration: r.duration,
      slug: r.slug ?? undefined,
    };
  });

  return NextResponse.json(tracksResult);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const playlistId = Number(id);
  const access = await getAccessiblePlaylist(playlistId, userId);
  if (access.error) return access.error;

  const { track_id } = await req.json();

  const [existing] = await db
    .select({ trackId: playlistTracks.trackId })
    .from(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, track_id)))
    .limit(1);

  if (existing) return NextResponse.json({ duplicate: true });

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlistId));

  await db.insert(playlistTracks).values({
    playlistId,
    trackId: track_id,
    position: countResult?.count ?? 0,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const playlistId = Number(id);
  const access = await getAccessiblePlaylist(playlistId, userId);
  if (access.error) return access.error;

  const { track_id } = await req.json();
  await db
    .delete(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, track_id)));

  return NextResponse.json({ ok: true });
}
