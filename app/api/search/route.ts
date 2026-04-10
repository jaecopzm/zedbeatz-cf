export const runtime = 'edge';

import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ tracks: [], artists: [] });

  // Split query into words for better matching
  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const searchPattern = words.join('%');

  const [{ data: tracksByTitle }, { data: artists }] = await Promise.all([
    supabase
      .from("tracks")
      .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)")
      .ilike("title", `%${searchPattern}%`)
      .limit(20),
    supabase
      .from("artists")
      .select("id, name, slug, image_key")
      .ilike("name", `%${searchPattern}%`)
      .limit(8),
  ]);

  // Find tracks by matched artist IDs
  const artistIds = (artists ?? []).map((a) => a.id);
  const { data: tracksByArtist } = artistIds.length > 0
    ? await supabase
        .from("tracks")
        .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)")
        .in("artist_id", artistIds)
        .limit(15)
    : { data: [] };

  // Merge and deduplicate
  const seen = new Set<number>();
  const allTracks = [...(tracksByTitle ?? []), ...(tracksByArtist ?? [])].filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  }).slice(0, 20);

  return NextResponse.json({
    tracks: allTracks.map((t) => ({
      id: t.id, title: t.title, artistId: t.artist_id,
      artist: (t.artists as unknown as { name: string; slug?: string } | null)?.name ?? "Unknown",
      artistSlug: (t.artists as unknown as { name: string; slug?: string } | null)?.slug,
      featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
      audioUrl: getPublicUrl(t.audio_key),
      coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : null,
      duration: t.duration, slug: t.slug,
    })),
    artists: (artists ?? []).map((a) => ({
      id: a.id, name: a.name, slug: a.slug,
      imageUrl: a.image_key ? getPublicUrl(a.image_key) : null,
    })),
  });
}
