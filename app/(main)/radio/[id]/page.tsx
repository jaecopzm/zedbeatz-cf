import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/drizzle";
import { tracks, artists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import RadioClient from "./client";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const isNumeric = !isNaN(Number(id));

  const [track] = await db
    .select({ title: tracks.title, artistName: artists.name })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(isNumeric ? eq(tracks.id, parseInt(id)) : eq(tracks.slug, id))
    .limit(1);

  if (!track) return { title: "Radio" };

  return {
    title: `${track.title} — ${track.artistName}`,
    description: `Listen to ${track.title} by ${track.artistName} on ZedBeatz radio.`,
  };
}

export default async function RadioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNumeric = !isNaN(Number(id));

  const [track] = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      coverUrl: tracks.coverUrl,
      duration: tracks.duration,
      artistId: tracks.artistId,
      genre: tracks.genre,
      slug: tracks.slug,
      featuredArtists: tracks.featuredArtists,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(isNumeric ? eq(tracks.id, parseInt(id)) : eq(tracks.slug, id))
    .limit(1);

  if (!track || !track.artistName) return notFound();

  const audioUrl = getAudioUrl({ audioKey: track.audioKey }) ?? "";
  const coverUrl = getCoverUrl({ coverKey: track.coverKey, coverUrl: track.coverUrl }) ?? "/placeholder.png";

  return (
    <RadioClient
      seedTrack={{
        id: track.id,
        title: track.title,
        artist: track.artistName,
        artistSlug: track.artistSlug ?? undefined,
        audioUrl,
        coverUrl,
        duration: track.duration ? Number(track.duration) : undefined,
        slug: track.slug ?? undefined,
        featuredArtists: sanitizeFeaturedArtists(track.featuredArtists) ?? undefined,
        genre: track.genre ?? undefined,
        artist_id: track.artistId!,
      }}
    />
  );
}
