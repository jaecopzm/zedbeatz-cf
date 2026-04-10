import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { notFound } from "next/navigation";
import PlaylistPageClient from "./client";

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: playlist }, { data: trackData }] = await Promise.all([
    supabase.from("playlists").select("id, name, cover_key, is_featured, category, playlist_tracks(count)").eq("id", id).single(),
    supabase.from("playlist_tracks")
      .select("position, tracks(id, title, audio_key, cover_key, duration, slug, featured_artists, artists(id, name, slug))")
      .eq("playlist_id", id)
      .order("position"),
  ]);

  if (!playlist) notFound();

  const tracks = (trackData ?? []).map(({ tracks: t }: any) => ({
    id: t.id,
    title: t.title,
    artist: t.artists?.name ?? "Unknown",
    artistId: t.artists?.id,
    artistSlug: t.artists?.slug,
    featuredArtists: t.featured_artists,
    slug: t.slug,
    audioUrl: getPublicUrl(t.audio_key),
    coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : undefined,
    duration: t.duration,
  }));

  const firstCover = tracks.find(t => t.coverUrl)?.coverUrl ?? null;
  const coverUrl = playlist.cover_key ? getPublicUrl(playlist.cover_key) : firstCover;

  return <PlaylistPageClient playlist={{ ...playlist, coverUrl }} tracks={tracks} />;
}
