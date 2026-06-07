import { notFound } from "next/navigation";
import { db } from "@/lib/db/drizzle";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import AlbumClient from "./client";
import { albums, artists, tracks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const [albumRow] = await db.select({
    id: albums.id,
    title: albums.title,
    coverKey: albums.coverKey,
    releaseYear: albums.releaseYear,
    artistId: albums.artistId,
    slug: albums.slug,
    artistName: artists.name,
    artistSlug: artists.slug,
  })
    .from(albums)
    .leftJoin(artists, eq(albums.artistId, artists.id))
    .where(isNaN(Number(id)) ? eq(albums.slug, id) : eq(albums.id, Number(id)))
    .limit(1);

  if (!albumRow) return {};

  const rawTracks = await db.select({ title: tracks.title })
    .from(tracks)
    .where(eq(tracks.albumId, albumRow.id))
    .orderBy(asc(tracks.createdAt));

  const artistName = albumRow.artistName ?? "Unknown";
  const artistSlug = albumRow.artistSlug;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const albumUrl = `${baseUrl}/album/${albumRow.slug || albumRow.id}`;
  const coverUrl = albumRow.coverKey ? getPublicUrl(albumRow.coverKey) : undefined;
  const trackCount = rawTracks?.length ?? 0;
  const trackTitles = (rawTracks ?? []).slice(0, 5).map((t: any) => t.title);
  const tracksText = trackTitles.length > 0 ? ` Tracks: ${trackTitles.join(", ")}${trackCount > 5 ? ` and ${trackCount - 5} more` : ""}.` : "";
  const yearText = albumRow.releaseYear ? ` (${albumRow.releaseYear})` : "";

  return {
    title: `${albumRow.title} - ${artistName}${yearText} | Zambian Music Album`,
    description: `Download ${albumRow.title} by ${artistName} album${yearText}. Stream all ${trackCount} tracks, mp3 download free.${tracksText} Zambian music album on ZedBeatz.`,
    keywords: [
      albumRow.title, `${albumRow.title} album`, `${albumRow.title} full album`,
      `${artistName} ${albumRow.title}`, `${artistName} album ${albumRow.releaseYear || ""}`,
      `${albumRow.title} download`, `${albumRow.title} mp3 download`,
      `${albumRow.title} zip download`, `${artistName} album download`,
      `${artistName} album 2026`,
      ...trackTitles.map((t: string) => `${artistName} ${t}`),
      ...trackTitles.map((t: string) => `${t} mp3 download`),
      "Zambian music", "Zambian album", "Zambia music 2026", "ZedBeatz",
    ].concat([
      "Zambian music streaming", "free Zambian music download", "ZedBeatz Zambian music"
    ]),
    openGraph: {
      title: `${albumRow.title} - ${artistName}${yearText} | Zambian Music Album`,
      description: `Stream and download ${albumRow.title} album by ${artistName} on ZedBeatz. ${trackCount} tracks available.`,
      url: albumUrl,
      siteName: "ZedBeatz",
      images: coverUrl ? [{ url: coverUrl, width: 800, height: 800, alt: `${albumRow.title} by ${artistName} - Zambian Music Album`, type: "image/jpeg" }] : [],
      locale: "en_ZM",
      type: "music.album",
      countryName: "Zambia",
    },
    twitter: {
      card: "summary_large_image",
      title: `${albumRow.title} - ${artistName} | Zambian Album`,
      description: `Download ${albumRow.title} album by ${artistName} on ZedBeatz. ${trackCount} tracks.`,
      images: coverUrl ? [coverUrl] : [],
    },
    alternates: { canonical: albumUrl },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [albumRow] = await db.select({
    id: albums.id,
    title: albums.title,
    coverKey: albums.coverKey,
    releaseYear: albums.releaseYear,
    artistId: albums.artistId,
    slug: albums.slug,
    artistName: artists.name,
    artistSlug: artists.slug,
  })
    .from(albums)
    .leftJoin(artists, eq(albums.artistId, artists.id))
    .where(isNaN(Number(id)) ? eq(albums.slug, id) : eq(albums.id, Number(id)))
    .limit(1);

  if (!albumRow) notFound();

  const rawTracks = await db.select({
    id: tracks.id,
    title: tracks.title,
    audioKey: tracks.audioKey,
    coverKey: tracks.coverKey,
    duration: tracks.duration,
    artistId: tracks.artistId,
    slug: tracks.slug,
    featuredArtists: tracks.featuredArtists,
    plays: tracks.plays,
    artistName: artists.name,
    artistSlug: artists.slug,
  })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(eq(tracks.albumId, albumRow.id))
    .orderBy(asc(tracks.createdAt));

  const artistName = albumRow.artistName ?? "Unknown";
  const artistSlug = albumRow.artistSlug;
  const tracksList: Track[] = (rawTracks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    artistId: t.artistId ?? undefined,
    artist: t.artistName ?? artistName,
    artistSlug: t.artistSlug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(t.featuredArtists),
    audioUrl: getPublicUrl(t.audioKey),
    coverUrl: t.coverKey ? getPublicUrl(t.coverKey) : undefined,
    duration: t.duration ? Number(t.duration) : undefined,
    slug: t.slug ?? undefined,
  }));

  const totalPlays = (rawTracks ?? []).reduce((sum, t) => sum + (t.plays ?? 0), 0);

  const coverUrl = albumRow.coverKey ? getPublicUrl(albumRow.coverKey) : null;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const albumUrl = `${baseUrl}/album/${albumRow.slug || albumRow.id}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
        { "@type": "ListItem", "position": 2, "name": artistName, "item": `${baseUrl}/artist/${artistSlug || artistName}` },
        { "@type": "ListItem", "position": 3, "name": albumRow.title, "item": albumUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "MusicAlbum",
      name: albumRow.title,
      url: albumUrl,
      ...(albumRow.releaseYear && { datePublished: `${albumRow.releaseYear}` }),
      ...(coverUrl && { image: coverUrl }),
      byArtist: {
        "@type": "MusicGroup",
        name: artistName,
        ...(artistSlug && { url: `${baseUrl}/artist/${artistSlug}` }),
      },
      genre: "Zambian Music",
      numTracks: tracksList.length,
      ...(tracksList.length > 0 && {
        track: tracksList.map((t, i) => ({
          "@type": "MusicRecording",
          position: i + 1,
          name: t.title,
          ...(t.duration && { duration: `PT${Math.floor(t.duration)}S` }),
          byArtist: {
            "@type": "MusicGroup",
            name: t.artist,
          },
          url: `${baseUrl}/track/${t.slug || t.id}`,
        })),
      }),
    },
  ];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <AlbumClient
        album={{
          id: albumRow.id,
          title: albumRow.title,
          slug: albumRow.slug ?? null,
          artistName,
          artistSlug: artistSlug ?? null,
          coverUrl,
          releaseYear: albumRow.releaseYear ?? null,
        }}
        tracks={tracksList}
        totalPlays={totalPlays}
      />
    </div>
  );
}
