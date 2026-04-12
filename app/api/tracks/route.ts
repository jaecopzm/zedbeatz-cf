import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 100;
  const search = req.nextUrl.searchParams.get("search");
  const sort = req.nextUrl.searchParams.get("sort");

  let query = supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, genre, featured_artists, plays, slug, artist_id, artists(name, slug)")
    .limit(limit);

  if (search) query = query.ilike("title", `%${search}%`);

  // Sort by trending (plays) or created_at
  if (sort === "trending") {
    query = query.order("plays", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tracks = (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    artist: (r.artists as unknown as { name: string } | null)?.name ?? "Unknown",
    artistId: r.artist_id,
    artistSlug: (r.artists as unknown as { slug: string } | null)?.slug,
    featuredArtists: sanitizeFeaturedArtists(r.featured_artists),
    audioUrl: getPublicUrl(r.audio_key),
    coverUrl: r.cover_key ? getPublicUrl(r.cover_key) : null,
    duration: r.duration,
    slug: r.slug,
    plays: r.plays,
    genre: r.genre,
  }));

  return NextResponse.json(tracks);
}
