import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { tracks, artists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [data] = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      lyrics: tracks.lyrics,
      syncedLyrics: tracks.syncedLyrics,
      artistName: artists.name,
    })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(eq(tracks.id, Number(id)))
    .limit(1);

  if (!data) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    artist: data.artistName || "Unknown",
    lyrics: data.lyrics,
    synced_lyrics: data.syncedLyrics,
    has_lyrics: !!data.lyrics || !!data.syncedLyrics,
  });
}
