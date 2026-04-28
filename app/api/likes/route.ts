export const runtime = 'edge';

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getFavouritesId(userId: string): Promise<number | null> {
  // If duplicates already exist, always reuse the oldest one instead of creating more.
  const { data: existing } = await supabase
    .from("playlists")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "Favourites")
    .order("id", { ascending: true })
    .limit(1);

  if (existing && existing.length > 0) return existing[0].id;

  // Create new Favourites playlist only if not found
  const { data: created, error } = await supabase
    .from("playlists")
    .insert({ name: "Favourites", user_id: userId })
    .select("id")
    .single();

  // If insert failed due to duplicate, try to fetch again
  if (error) {
    const { data: retry } = await supabase
      .from("playlists")
      .select("id")
      .eq("user_id", userId)
      .eq("name", "Favourites")
      .order("id", { ascending: true })
      .limit(1);
    
    if (retry && retry.length > 0) return retry[0].id;
    return null;
  }

  return created?.id ?? null;
}

// GET /api/likes?track_id=123 — check if liked
// GET /api/likes — get all liked track IDs
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ liked: false, likedIds: [] });

  const trackId = req.nextUrl.searchParams.get("track_id");
  
  // Batch: return all liked track IDs
  if (!trackId) {
    const favId = await getFavouritesId(userId);
    if (!favId) return NextResponse.json({ likedIds: [] });

    const { data } = await supabase
      .from("playlist_tracks")
      .select("track_id")
      .eq("playlist_id", favId);

    return NextResponse.json({ likedIds: (data || []).map(d => d.track_id) });
  }

  // Single track check
  const favId = await getFavouritesId(userId);
  if (!favId) return NextResponse.json({ liked: false });

  const { data } = await supabase
    .from("playlist_tracks")
    .select("id")
    .eq("playlist_id", favId)
    .eq("track_id", Number(trackId))
    .maybeSingle();

  return NextResponse.json({ liked: !!data });
}

// POST /api/likes — toggle like
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { track_id } = await req.json();
  if (!track_id) return NextResponse.json({ error: "Missing track_id" }, { status: 400 });

  const favId = await getFavouritesId(userId);
  if (!favId) return NextResponse.json({ error: "Could not create Favourites playlist" }, { status: 500 });

  // Check if already liked
  const { data: existing } = await supabase
    .from("playlist_tracks")
    .select("track_id")
    .eq("playlist_id", favId)
    .eq("track_id", track_id)
    .maybeSingle();

  if (existing) {
    // Unlike
    await supabase.from("playlist_tracks").delete().eq("playlist_id", favId).eq("track_id", track_id);
    return NextResponse.json({ liked: false });
  }

  // Like - add to end
  const { error } = await supabase.from("playlist_tracks").insert({
    playlist_id: favId,
    track_id,
    position: Math.floor(Date.now() / 1000), // Unix timestamp in seconds (fits in int)
  });

  if (error) {
    console.error("Failed to like track:", error);
    return NextResponse.json({ error: "Failed to like track" }, { status: 500 });
  }

  return NextResponse.json({ liked: true });
}
