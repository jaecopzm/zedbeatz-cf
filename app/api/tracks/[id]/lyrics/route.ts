import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/index";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const { data, error } = await supabase
    .from("tracks")
    .select("id, title, lyrics, synced_lyrics, artists(name)")
    .eq("id", Number(id))
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    artist: (data.artists as any)?.name || "Unknown",
    lyrics: data.lyrics,
    synced_lyrics: data.synced_lyrics,
    has_lyrics: !!data.lyrics || !!data.synced_lyrics
  });
}
