import { notFound } from "next/navigation";
import { supabase } from "@/lib/db";
import RadioClient from "./client";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";

export default async function RadioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNumeric = !isNaN(Number(id));
  
  const { data: track } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, artist_id, genre, slug, featured_artists, artists(name, slug)")
    .eq(isNumeric ? "id" : "slug", isNumeric ? parseInt(id) : id)
    .single();

  if (!track || !track.artists) return notFound();

  const audioUrl = getPublicUrl(track.audio_key);
  const coverUrl = track.cover_key ? getPublicUrl(track.cover_key) : "/placeholder.png";

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
        featuredArtists: sanitizeFeaturedArtists(track.featured_artists) ?? undefined,
        genre: track.genre ?? undefined,
        artist_id: track.artist_id!,
      }}
    />
  );
}
