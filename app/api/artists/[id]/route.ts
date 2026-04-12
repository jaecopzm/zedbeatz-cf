import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try to get artist by ID or slug
  let artistQuery = supabase.from("artists").select("id, name, bio, image_key, slug");
  artistQuery = isNaN(Number(id)) 
    ? artistQuery.eq("slug", id) 
    : artistQuery.eq("id", Number(id));
  
  const { data: artist } = await artistQuery.single();
  if (!artist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, genre, plays, slug, featured_artists")
    .eq("artist_id", artist.id)
    .order("plays", { ascending: false });

  return NextResponse.json({
    ...artist,
    imageUrl: artist.image_key ? getPublicUrl(artist.image_key) : null,
    tracks: (tracks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      artist: artist.name,
      artistSlug: artist.slug,
      featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
      audioUrl: getPublicUrl(t.audio_key),
      coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : null,
      duration: t.duration,
      slug: t.slug,
      genre: t.genre,
      plays: t.plays,
    })),
  });
}
