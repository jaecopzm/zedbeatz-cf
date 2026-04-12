import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ tracks: [] });
  }

  const { data } = await supabase
    .from("recently_played")
    .select("track_id, played_at, tracks(id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug))")
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .limit(50);

  if (!data) return NextResponse.json({ tracks: [] });

  // Deduplicate by track_id, keep most recent
  const seen = new Set<number>();
  const tracks = data
    .filter((r: any) => {
      if (!r.tracks || seen.has(r.track_id)) return false;
      seen.add(r.track_id);
      return true;
    })
    .slice(0, 12)
    .map((r: any) => {
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
      playedAt: r.played_at,
    };
  });

  return NextResponse.json({ tracks });
}
