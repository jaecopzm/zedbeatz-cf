import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/index";

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

  const { data, error } = await supabase
    .from("tracks")
    .select("id, lyrics, synced_lyrics")
    .in("id", track_ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data.map(track => ({
    id: track.id,
    has_lyrics: !!track.lyrics || !!track.synced_lyrics,
    has_synced: !!track.synced_lyrics
  }));

  return NextResponse.json(result);
}
