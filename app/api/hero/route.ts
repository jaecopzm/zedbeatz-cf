import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { NextResponse } from "next/server";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";

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
  const { data, error } = await supabase
    .from("hero_tracks")
    .select(TRACK_SELECT)
    .order("position");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapTrack));
}
