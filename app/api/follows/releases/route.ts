import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ tracks: [] });
  }

  // Get the artist IDs the user follows
  const { data: follows } = await supabase
    .from("follows")
    .select("artist_id")
    .eq("user_id", userId);

  if (!follows || follows.length === 0) {
    return NextResponse.json({ tracks: [] });
  }

  const artistIds = follows.map((f: any) => f.artist_id);

  // Get the latest tracks from those artists
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, created_at, artists(name, slug)")
    .in("artist_id", artistIds)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!tracks) return NextResponse.json({ tracks: [] });

  const mapped = tracks.map((t: any) => ({
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
    createdAt: t.created_at,
  }));

  return NextResponse.json({ tracks: mapped });
}
