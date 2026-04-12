import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TRACK_SELECT = "track_id, position, tracks(id, title, audio_key, cover_key, duration, slug, featured_artists, artist_id, artists(name, slug))";

function mapTrack(r: any) {
  const t = r.tracks;
  return {
    id: t.id,
    title: t.title,
    artistId: t.artist_id,
    artist: t.artists?.name ?? "Unknown",
    artistSlug: t.artists?.slug,
    featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
    audioUrl: getPublicUrl(t.audio_key),
    coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : null,
    duration: t.duration,
    slug: t.slug,
  };
}

export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny;
  const { data, error } = await supabase
    .from("hero_tracks")
    .select(TRACK_SELECT)
    .order("position");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapTrack));
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { track_id } = await req.json();
  const { count } = await supabase.from("hero_tracks").select("*", { count: "exact", head: true });
  const { error } = await supabase.from("hero_tracks").upsert({ track_id, position: count ?? 0 }, { onConflict: "track_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { track_id } = await req.json();
  const { error } = await supabase.from("hero_tracks").delete().eq("track_id", track_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { order } = await req.json();
  await Promise.all(
    order.map(({ track_id, position }: { track_id: number; position: number }) =>
      supabase.from("hero_tracks").update({ position }).eq("track_id", track_id)
    )
  );
  return NextResponse.json({ ok: true });
}
