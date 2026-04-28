import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import AlbumClient from "./client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const { data: album } = await unstable_cache(
    async () => {
      let query = supabase.from("albums").select("id, title, cover_key, release_year, artist_id, slug, artists(name, slug)");
      return isNaN(Number(id)) ? query.eq("slug", id).single() : query.eq("id", Number(id)).single();
    },
    [`album-meta-${id}`],
    { revalidate: 600 }
  )();

  if (!album) return {};

  const { data: rawTracks } = await unstable_cache(
    async () => supabase.from("tracks").select("title").eq("album_id", album.id).order("created_at"),
    [`album-tracks-meta-${album.id}`],
    { revalidate: 600 }
  )();

  const artistName = (album.artists as { name: string; slug?: string } | null)?.name ?? "Unknown";
  const artistSlug = (album.artists as { name: string; slug?: string } | null)?.slug;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";
  const albumUrl = `${baseUrl}/album/${album.slug || album.id}`;
  const coverUrl = album.cover_key ? getPublicUrl(album.cover_key) : undefined;
  const trackCount = rawTracks?.length ?? 0;
  const trackTitles = (rawTracks ?? []).slice(0, 5).map((t: any) => t.title);
  const tracksText = trackTitles.length > 0 ? ` Tracks: ${trackTitles.join(", ")}${trackCount > 5 ? ` and ${trackCount - 5} more` : ""}.` : "";
  const yearText = album.release_year ? ` (${album.release_year})` : "";

  return {
    title: `${album.title} - ${artistName}${yearText} | Album Download | ZedBeatz`,
    description: `Download ${album.title} by ${artistName} album${yearText}. Stream all ${trackCount} tracks, mp3 download free.${tracksText} Zambian music on ZedBeatz.`,
    keywords: [
      album.title, `${album.title} album`, `${artistName} ${album.title}`,
      `${album.title} download`, `${album.title} mp3 download`,
      `${artistName} album`, `${artistName} ${album.release_year || ""}`,
      ...trackTitles.map((t: string) => `${artistName} ${t}`),
      "Zambian music", "Zambian album", "ZedBeatz",
    ].join(", "),
    openGraph: {
      title: `${album.title} - ${artistName}${yearText}`,
      description: `Stream and download ${album.title} album by ${artistName} on ZedBeatz. ${trackCount} tracks available.`,
      url: albumUrl,
      siteName: "ZedBeatz",
      images: coverUrl ? [{ url: coverUrl, width: 800, height: 800, alt: `${album.title} by ${artistName}` }] : [],
      locale: "en_ZM",
      type: "music.album",
    },
    twitter: {
      card: "summary_large_image",
      title: `${album.title} - ${artistName}`,
      description: `Download ${album.title} album on ZedBeatz`,
      images: coverUrl ? [coverUrl] : [],
    },
    alternates: { canonical: albumUrl },
  };
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: album } = await unstable_cache(
    async () => {
      let query = supabase.from("albums").select("id, title, cover_key, release_year, artist_id, slug, artists(name, slug)");
      return isNaN(Number(id)) ? query.eq("slug", id).single() : query.eq("id", Number(id)).single();
    },
    [`album-${id}`],
    { revalidate: 600 }
  )();

  if (!album) notFound();

  const { data: rawTracks } = await unstable_cache(
    async () => supabase.from("tracks").select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, plays, artists(name, slug)").eq("album_id", album.id).order("created_at"),
    [`album-tracks-${album.id}`],
    { revalidate: 600 }
  )();

  const artistName = (album.artists as { name: string; slug?: string } | null)?.name ?? "Unknown";
  const artistSlug = (album.artists as { name: string; slug?: string } | null)?.slug;
  const tracks: Track[] = (rawTracks ?? []).map((t) => ({
    id: t.id, title: t.title, artistId: t.artist_id ?? undefined,
    artist: (t.artists as { name: string } | null)?.name ?? artistName,
    artistSlug: (t.artists as { slug: string } | null)?.slug,
    featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
    audioUrl: getPublicUrl(t.audio_key),
    coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : undefined,
    duration: t.duration ?? undefined,
    slug: t.slug ?? undefined,
  }));

  const totalPlays = (rawTracks ?? []).reduce((sum, t) => sum + (t.plays ?? 0), 0);

  const coverUrl = album.cover_key ? getPublicUrl(album.cover_key) : null;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";
  const albumUrl = `${baseUrl}/album/${album.slug || album.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: album.title,
    url: albumUrl,
    ...(album.release_year && { datePublished: `${album.release_year}` }),
    ...(coverUrl && { image: coverUrl }),
    byArtist: {
      "@type": "MusicGroup",
      name: artistName,
      ...(artistSlug && { url: `${baseUrl}/artist/${artistSlug}` }),
    },
    numTracks: tracks.length,
    ...(tracks.length > 0 && {
      track: tracks.map((t, i) => ({
        "@type": "MusicRecording",
        position: i + 1,
        name: t.title,
        ...(t.duration && { duration: `PT${Math.floor(t.duration)}S` }),
        byArtist: {
          "@type": "MusicGroup",
          name: t.artist,
        },
      })),
    }),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <AlbumClient
        album={{
          title: album.title,
          artistName,
          artistSlug: artistSlug ?? null,
          coverUrl,
          releaseYear: album.release_year ?? null,
        }}
        tracks={tracks}
        totalPlays={totalPlays}
      />
    </div>
  );
}
