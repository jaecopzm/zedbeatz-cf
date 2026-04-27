import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get("trackId");

  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId" }, { status: 400 });
  }

  // Get the seed track
  const { data: seedTrack } = await supabase
    .from("tracks")
    .select("id, artist_id, genre")
    .eq("id", parseInt(trackId))
    .single();

  if (!seedTrack) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // Fetch artist tracks (excluding seed track)
  const { data: artistTracks } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)")
    .eq("artist_id", seedTrack.artist_id!)
    .neq("id", seedTrack.id)
    .limit(20);

  // Fetch genre tracks (different artists)
  let genreTracks = null;
  if (seedTrack.genre) {
    const result = await supabase
      .from("tracks")
      .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)")
      .eq("genre", seedTrack.genre)
      .neq("artist_id", seedTrack.artist_id!)
      .limit(15);
    genreTracks = result.data;
  }

  // Combine and shuffle
  const allTracks = [...(artistTracks || []), ...(genreTracks || [])];
  
  // Shuffle array
  for (let i = allTracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
  }

  // Format tracks
  const radioTracks = allTracks.slice(0, 25).map((t: any) => ({
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
  }));

  return NextResponse.json({ tracks: radioTracks });
}
