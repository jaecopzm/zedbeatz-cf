import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: artist }, { data: tracks }] = await Promise.all([
    supabase.from("artists").select("id, name, bio, image_key").eq("id", Number(id)).single(),
    supabase.from("tracks").select("id, title, audio_key, cover_key, duration, genre, plays").eq("artist_id", Number(id)).order("created_at", { ascending: false }),
  ]);

  if (!artist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...artist,
    imageUrl: artist.image_key ? getPublicUrl(artist.image_key) : null,
    tracks: (tracks ?? []).map((t) => ({
      id: t.id, title: t.title, genre: t.genre, plays: t.plays, duration: t.duration,
      artist: artist.name,
      audioUrl: getPublicUrl(t.audio_key),
      coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : null,
    })),
  });
}
