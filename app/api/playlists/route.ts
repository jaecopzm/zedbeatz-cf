import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getPublicUrl } from "@/lib/r2";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fetches playlists with track count + first track cover for fallback
const PLAYLIST_SELECT = "id, name, cover_key, is_featured, category, created_at, playlist_tracks(position, tracks(cover_key))";

type PlaylistTrackCover = {
  position: number;
  tracks: { cover_key: string | null } | null;
};

type PlaylistRecord = {
  id: number;
  name: string;
  cover_key: string | null;
  is_featured?: boolean | null;
  category?: string | null;
  created_at?: string | null;
  playlist_tracks?: PlaylistTrackCover[];
};

function enrichPlaylist(p: PlaylistRecord) {
  const tracks = p.playlist_tracks ?? [];
  const sorted = [...tracks].sort((a, b) => a.position - b.position);
  const firstCoverKey = sorted[0]?.tracks?.cover_key ?? null;
  const cover_url = p.cover_key
    ? getPublicUrl(p.cover_key)
    : firstCoverKey
    ? getPublicUrl(firstCoverKey)
    : null;
  return { ...p, cover_url, playlist_tracks: [{ count: tracks.length }] };
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const searchParams = new URL(req.url).searchParams;
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (type === "admin") {
    const { data, error } = await supabase
      .from("playlists")
      .select(PLAYLIST_SELECT)
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(enrichPlaylist));
  }

  if (type === "user" && userId) {
    const { data, error } = await supabase
      .from("playlists")
      .select(PLAYLIST_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(enrichPlaylist));
  }

  if (type === "user") {
    return NextResponse.json([]);
  }

  if (type === "saved" && userId) {
    const { data, error } = await supabase
      .from("saved_playlists")
      .select(`playlist_id, playlists(${PLAYLIST_SELECT})`)
      .eq("user_id", userId)
      .range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      (data ?? []).flatMap((r) => (r.playlists ? [enrichPlaylist(r.playlists as unknown as PlaylistRecord)] : []))
    );
  }

  if (type === "saved") {
    return NextResponse.json([]);
  }

  // Fallback: all playlists (used by admin)
  const { data, error } = await supabase
    .from("playlists")
    .select(PLAYLIST_SELECT)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(enrichPlaylist));
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Save/unsave an admin playlist to library
  if (body.action === "save") {
    const { error } = await supabase
      .from("saved_playlists")
      .upsert({ user_id: userId, playlist_id: body.playlist_id }, { onConflict: "user_id,playlist_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "unsave") {
    const { error } = await supabase
      .from("saved_playlists")
      .delete()
      .eq("user_id", userId)
      .eq("playlist_id", body.playlist_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Create user playlist
  const insertData = body.is_admin 
    ? { 
        name: body.name, 
        user_id: null,
        category: body.category || null,
        is_featured: body.is_featured ?? true
      }
    : { name: body.name, user_id: userId };
    
  const { data, error } = await supabase
    .from("playlists")
    .insert(insertData)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await req.json();
  
  // Verify ownership for user playlists
  const { data: playlist } = await supabase
    .from("playlists")
    .select("user_id")
    .eq("id", id)
    .single();
    
  if (!playlist) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  if (playlist.user_id && playlist.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const { error } = await supabase.from("playlists").update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  
  // Verify ownership for user playlists
  const { data: playlist } = await supabase
    .from("playlists")
    .select("user_id")
    .eq("id", id)
    .single();
    
  if (!playlist) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  if (playlist.user_id && playlist.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const { error } = await supabase.from("playlists").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
