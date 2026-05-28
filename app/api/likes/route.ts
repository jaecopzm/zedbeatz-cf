import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/drizzle";
import { playlists, playlistTracks } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";

async function getFavouritesId(userId: string): Promise<number | null> {
  const [existing] = await db
    .select({ id: playlists.id })
    .from(playlists)
    .where(and(eq(playlists.userId, userId), eq(playlists.name, "Favourites")))
    .orderBy(asc(playlists.id))
    .limit(1);

  if (existing) return existing.id;

  try {
    const [created] = await db
      .insert(playlists)
      .values({ name: "Favourites", userId })
      .returning({ id: playlists.id });

    return created?.id ?? null;
  } catch {
    const [retry] = await db
      .select({ id: playlists.id })
      .from(playlists)
      .where(and(eq(playlists.userId, userId), eq(playlists.name, "Favourites")))
      .orderBy(asc(playlists.id))
      .limit(1);

    return retry?.id ?? null;
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ liked: false, likedIds: [] });

  const trackId = req.nextUrl.searchParams.get("track_id");
  const favId = await getFavouritesId(userId);
  if (!favId) return NextResponse.json({ liked: false, likedIds: [] });

  if (!trackId) {
    const data = await db
      .select({ trackId: playlistTracks.trackId })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, favId));

    return NextResponse.json({ likedIds: data.map((d) => d.trackId) });
  }

  const [data] = await db
    .select({ id: playlistTracks.trackId })
    .from(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, favId), eq(playlistTracks.trackId, Number(trackId))))
    .limit(1);

  return NextResponse.json({ liked: !!data });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { track_id } = await req.json();
  if (!track_id) return NextResponse.json({ error: "Missing track_id" }, { status: 400 });

  const favId = await getFavouritesId(userId);
  if (!favId) return NextResponse.json({ error: "Could not create Favourites playlist" }, { status: 500 });

  const [existing] = await db
    .select({ trackId: playlistTracks.trackId })
    .from(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, favId), eq(playlistTracks.trackId, track_id)))
    .limit(1);

  if (existing) {
    await db
      .delete(playlistTracks)
      .where(and(eq(playlistTracks.playlistId, favId), eq(playlistTracks.trackId, track_id)));
    return NextResponse.json({ liked: false });
  }

  await db.insert(playlistTracks).values({
    playlistId: favId,
    trackId: track_id,
    position: Math.floor(Date.now() / 1000),
  });

  return NextResponse.json({ liked: true });
}
