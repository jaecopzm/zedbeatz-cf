import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("playlist_tracks")
    .select("position, tracks(id, title, audio_key, cover_key, duration, slug, featured_artists, artist_id, artists(name, slug))")
    .eq("playlist_id", Number(id))
    .order("position");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const tracks = (data ?? []).map(({ tracks: t }) => {
    const track = t as any;
    return {
      id: track.id,
      title: track.title,
      artist: track.artists?.name ?? "Unknown",
      artistId: track.artist_id ?? undefined,
      artistSlug: track.artists?.slug ?? undefined,
      featuredArtists: sanitizeFeaturedArtists(track.featured_artists),
      audioUrl: getPublicUrl(track.audio_key),
      coverUrl: track.cover_key ? getPublicUrl(track.cover_key) : null,
      duration: track.duration,
      slug: track.slug ?? undefined,
    };
  });
  return NextResponse.json(tracks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { track_id } = await req.json();

  // Duplicate guard
  const { data: existing } = await supabase.from("playlist_tracks").select("track_id").eq("playlist_id", Number(id)).eq("track_id", track_id).limit(1);
  if (existing && existing.length > 0) return NextResponse.json({ duplicate: true });

  const { count } = await supabase.from("playlist_tracks").select("*", { count: "exact", head: true }).eq("playlist_id", Number(id));
  const { error } = await supabase.from("playlist_tracks").insert({ playlist_id: Number(id), track_id, position: count ?? 0 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { track_id } = await req.json();
  const { error } = await supabase.from("playlist_tracks").delete().eq("playlist_id", Number(id)).eq("track_id", track_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
