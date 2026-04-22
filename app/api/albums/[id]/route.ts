import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isNumeric = /^\d+$/.test(id);

  // Fetch album
  let albumQuery = supabase
    .from("albums")
    .select(`
      id,
      title,
      slug,
      cover_key,
      release_year,
      artist_id,
      artists(name, slug)
    `);

  if (isNumeric) {
    albumQuery = albumQuery.eq("id", parseInt(id));
  } else {
    albumQuery = albumQuery.eq("slug", id);
  }

  const { data: albumData, error: albumError } = await albumQuery.single();

  if (albumError || !albumData) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  // Fetch tracks for this album
  let { data: tracksData, error: tracksError } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, featured_artists, plays, slug, artist_id, artists(name, slug)")
    .eq("album_id", albumData.id)
    .order("created_at", { ascending: true });

  // If no tracks found by album_id, show artist's tracks as fallback
  if ((!tracksData || tracksData.length === 0) && albumData.artist_id) {
    const { data: fallbackTracks } = await supabase
      .from("tracks")
      .select("id, title, audio_key, cover_key, duration, featured_artists, plays, slug, artist_id, artists(name, slug)")
      .eq("artist_id", albumData.artist_id)
      .limit(50);
    
    tracksData = fallbackTracks || [];
  }

  if (tracksError) {
    return NextResponse.json({ error: tracksError.message }, { status: 500 });
  }

  const album = {
    id: albumData.id,
    title: albumData.title,
    slug: albumData.slug,
    artist: (albumData.artists as unknown as { name: string } | null)?.name ?? "Unknown",
    artistSlug: (albumData.artists as unknown as { slug: string } | null)?.slug,
    coverUrl: albumData.cover_key ? getPublicUrl(albumData.cover_key) : null,
    releaseYear: albumData.release_year,
    trackCount: tracksData?.length ?? 0,
  };

  const tracks = (tracksData ?? []).map((r) => ({
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
  }));

  return NextResponse.json({ album, tracks });
}
