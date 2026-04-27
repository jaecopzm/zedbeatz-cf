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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch all play events to aggregate stats
  const { data: plays, error } = await supabase
    .from("recently_played")
    .select("track_id, tracks(duration, artist_id)")
    .eq("user_id", userId);

  if (error || !plays) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }

  if (plays.length === 0) {
    return NextResponse.json({
      totalListeningTime: 0,
      totalPlays: 0,
      topTracks: [],
      topArtists: []
    });
  }

  let totalListeningTime = 0;
  const trackCounts: Record<number, number> = {};
  const artistCounts: Record<number, number> = {};

  // Aggregate stats
  for (const play of plays as any[]) {
    const t = play.tracks;
    if (!t) continue;

    totalListeningTime += (t.duration || 0);

    const tid = play.track_id;
    trackCounts[tid] = (trackCounts[tid] || 0) + 1;

    const aid = t.artist_id;
    if (aid) {
      artistCounts[aid] = (artistCounts[aid] || 0) + 1;
    }
  }

  // Sort and get top IDs
  const topTrackIds = Object.entries(trackCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => parseInt(id));

  const topArtistIds = Object.entries(artistCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => parseInt(id));

  // 2. Fetch full details for top tracks
  let topTracks: any[] = [];
  if (topTrackIds.length > 0) {
    const { data: tracksData } = await supabase
      .from("tracks")
      .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)")
      .in("id", topTrackIds);

    if (tracksData) {
      // Map and sort them back to the correct order
      topTracks = topTrackIds.map(id => {
        const t: any = tracksData.find(td => td.id === id);
        if (!t) return null;
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
          plays: trackCounts[id]
        };
      }).filter(Boolean);
    }
  }

  // 3. Fetch full details for top artists
  let topArtists: any[] = [];
  if (topArtistIds.length > 0) {
    const { data: artistsData } = await supabase
      .from("artists")
      .select("id, name, slug, image_key")
      .in("id", topArtistIds);

    if (artistsData) {
      topArtists = topArtistIds.map(id => {
        const a: any = artistsData.find(ad => ad.id === id);
        if (!a) return null;
        return {
          id: a.id,
          name: a.name,
          slug: a.slug,
          imageUrl: a.image_key ? getPublicUrl(a.image_key) : null,
          plays: artistCounts[id]
        };
      }).filter(Boolean);
    }
  }

  return NextResponse.json({
    totalListeningTime, // in seconds
    totalPlays: plays.length,
    topTracks,
    topArtists
  });
}
