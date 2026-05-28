import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { tracks } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { track_ids } = body;

  if (!track_ids || !Array.isArray(track_ids)) {
    return NextResponse.json(
      { error: "track_ids array is required" },
      { status: 400 }
    );
  }

  const data = await db
    .select({
      id: tracks.id,
      lyrics: tracks.lyrics,
      syncedLyrics: tracks.syncedLyrics,
    })
    .from(tracks)
    .where(inArray(tracks.id, track_ids));

  const result = data.map(track => ({
    id: track.id,
    has_lyrics: !!track.lyrics || !!track.syncedLyrics,
    has_synced: !!track.syncedLyrics,
  }));

  return NextResponse.json(result);
}
