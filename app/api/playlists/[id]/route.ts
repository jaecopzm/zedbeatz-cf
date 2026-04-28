import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

async function getAccessiblePlaylist(id: number, userId: string | null) {
  const { data, error } = await supabase
    .from("playlists")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { error: NextResponse.json({ error: "Playlist not found" }, { status: 404 }) };
  }

  if (data.user_id && data.user_id !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { playlist: data };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PlaylistTrackRelation = {
  tracks: {
    id: number;
    title: string;
    audio_key: string;
    cover_key: string | null;
    duration: number | null;
    slug: string | null;
    featured_artists: string | null;
    artist_id: number | null;
    artists: { name: string; slug: string | null } | null;
  } | null;
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  const playlistId = Number(id);
  const access = await getAccessiblePlaylist(playlistId, userId);
  if (access.error) return access.error;

  const { data, error } = await supabase
    .from("playlist_tracks")
    .select("position, tracks(id, title, audio_key, cover_key, duration, slug, featured_artists, artist_id, artists(name, slug))")
    .eq("playlist_id", playlistId)
    .order("position");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const tracks = (data ?? []).flatMap(({ tracks: t }: PlaylistTrackRelation) => {
    if (!t) return [];

    return {
      id: t.id,
      title: t.title,
      artist: t.artists?.name ?? "Unknown",
      artistId: t.artist_id ?? undefined,
      artistSlug: t.artists?.slug ?? undefined,
      featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
      audioUrl: getPublicUrl(t.audio_key),
      coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : null,
      duration: t.duration,
      slug: t.slug ?? undefined,
    };
  });
  return NextResponse.json(tracks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const playlistId = Number(id);
  const access = await getAccessiblePlaylist(playlistId, userId);
  if (access.error) return access.error;

  const { track_id } = await req.json();

  // Duplicate guard
  const { data: existing } = await supabase.from("playlist_tracks").select("track_id").eq("playlist_id", playlistId).eq("track_id", track_id).limit(1);
  if (existing && existing.length > 0) return NextResponse.json({ duplicate: true });

  const { count } = await supabase.from("playlist_tracks").select("*", { count: "exact", head: true }).eq("playlist_id", playlistId);
  const { error } = await supabase.from("playlist_tracks").insert({ playlist_id: playlistId, track_id, position: count ?? 0 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const playlistId = Number(id);
  const access = await getAccessiblePlaylist(playlistId, userId);
  if (access.error) return access.error;

  const { track_id } = await req.json();
  const { error } = await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId).eq("track_id", track_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
