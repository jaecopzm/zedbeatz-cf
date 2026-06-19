import { db } from "@/lib/db/drizzle";
import { tracks, artists } from "@/lib/db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import GenrePageClient from "./client";

function normalizeGenre(slug: string): string[] {
  const special: Record<string, string> = {
    rnb: "R&B",
    randb: "R&B",
    rb: "R&B",
  };
  if (special[slug]) return [special[slug]];
  return [slug.replace(/-/g, " "), slug];
}

async function getGenreData(slug: string) {
  const patterns = normalizeGenre(slug);

  const rawTracks = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      duration: tracks.duration,
      slug: tracks.slug,
      genre: tracks.genre,
      plays: tracks.plays,
      featuredArtists: tracks.featuredArtists,
      artistId: tracks.artistId,
      artistName: artists.name,
      artistSlug: artists.slug,
      createdAt: tracks.createdAt,
    })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(or(...patterns.map(p => ilike(tracks.genre, `%${p}%`))))
    .orderBy(desc(tracks.plays))
    .limit(100);

  const formattedTracks: Track[] = rawTracks.map((t) => ({
    id: t.id,
    title: t.title,
    artistId: t.artistId ?? undefined,
    artist: t.artistName ?? "Unknown",
    artistSlug: t.artistSlug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(t.featuredArtists),
    audioUrl: getPublicUrl(t.audioKey),
    coverUrl: t.coverKey ? getPublicUrl(t.coverKey) : undefined,
    duration: t.duration ? Number(t.duration) : undefined,
    slug: t.slug ?? undefined,
    createdAt: t.createdAt?.toISOString() ?? undefined,
  }));

  const matchedName = rawTracks.find((t) =>
    [...patterns, ...patterns.map(p => p.replace(/[^a-z0-9]/gi, ''))]
      .some(p => t.genre?.toLowerCase() === p.toLowerCase())
  )?.genre;

  const fallbackName = normalizeGenre(slug).length > 1
    ? normalizeGenre(slug)[0]
    : slug
      .replace(/-/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const genreName = rawTracks.length > 0 ? (matchedName ?? patterns[0]) : fallbackName;

  return { genreName, tracks: formattedTracks };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { genreName, tracks: genreTracks } = await getGenreData(slug);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const genreUrl = `${baseUrl}/genre/${slug}`;

  return {
    title: `${genreName} Music MP3 Download — Best ${genreName} Songs`,
    description: `Download latest ${genreName} music MP3 free. Stream top ${genreName} songs, artists, and albums. ${genreTracks.length} tracks available on ZedBeatz.`,
    keywords: [
      `${genreName} music`, `${genreName} songs`, `${genreName} mp3 download`,
      `${genreName} music Zambia`, `best ${genreName} songs`, `${genreName} 2026`,
      `${genreName} artists`, `download ${genreName} mp3`,
      `Zambian ${genreName} music`, `${genreName} Zambia`,
      ...genreTracks.slice(0, 10).map((t) => `${t.title} ${t.artist}`),
      ...genreTracks.slice(0, 10).map((t) => t.title),
      "Zambian music streaming", "free Zambian music download", "ZedBeatz",
    ],
    openGraph: {
      title: `${genreName} Music — Stream & Download MP3 | ZedBeatz`,
      description: `Browse ${genreTracks.length} ${genreName} tracks. Stream and download the best ${genreName} music from Zambia on ZedBeatz.`,
      url: genreUrl,
      siteName: "ZedBeatz",
      locale: "en_ZM",
    },
    twitter: {
      card: "summary_large_image",
      title: `${genreName} Music MP3 Download | ZedBeatz`,
      description: `Download latest ${genreName} music free. ${genreTracks.length} tracks available.`,
    },
    alternates: { canonical: genreUrl },
  };
}

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { genreName, tracks: genreTracks } = await getGenreData(slug);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const genreUrl = `${baseUrl}/genre/${slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
        { "@type": "ListItem", "position": 2, "name": "Genres", "item": `${baseUrl}/search` },
        { "@type": "ListItem", "position": 3, "name": genreName, "item": genreUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "MusicPlaylist",
      name: `${genreName} Music`,
      url: genreUrl,
      numTracks: genreTracks.length,
      genre: genreName,
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GenrePageClient genreName={genreName} tracks={genreTracks} />
    </>
  );
}
