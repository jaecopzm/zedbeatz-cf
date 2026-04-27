import { notFound } from "next/navigation";
import { supabase } from "@/lib/db";
import RadioClient from "./client";

export default async function RadioPage({ params }: { params: { id: string } }) {
  const { data: track } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, artist_id, genre, slug, featured_artists, artists(name, slug)")
    .eq("id", parseInt(params.id))
    .single();

  if (!track || !track.artists) return notFound();

  const audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio/${track.audio_key}`;
  const coverUrl = track.cover_key
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${track.cover_key}`
    : "/placeholder.png";

  return (
    <RadioClient
      seedTrack={{
        id: track.id,
        title: track.title,
        artist: track.artists.name,
        artistSlug: track.artists.slug ?? undefined,
        audioUrl,
        coverUrl,
        duration: track.duration ?? undefined,
        slug: track.slug ?? undefined,
        featuredArtists: track.featured_artists ?? undefined,
        genre: track.genre ?? undefined,
        artist_id: track.artist_id!,
      }}
    />
  );
}
