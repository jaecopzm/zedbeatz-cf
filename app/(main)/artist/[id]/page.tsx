import { notFound } from "next/navigation";
import { db } from "@/lib/db/drizzle";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import ArtistHeader from "@/components/artist/artist-header";
import ArtistPageClient from "./client";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { artists, tracks, albums } from "@/lib/db/schema";
import { eq, desc, and, ilike, isNotNull } from "drizzle-orm";

async function getArtistData(id: string) {
  const [artist] = await db.select({
    id: artists.id,
    name: artists.name,
    bio: artists.bio,
    imageKey: artists.imageKey,
    imageUrl: artists.imageUrl,
    slug: artists.slug,
  })
    .from(artists)
    .where(isNaN(Number(id)) ? eq(artists.slug, id) : eq(artists.id, Number(id)))
    .limit(1);

  if (!artist) return null;

  const [rawTracks, rawAlbums, appearsOnTracks] = await Promise.all([
    db.select({
      id: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      coverUrl: tracks.coverUrl,
      duration: tracks.duration,
      artistId: tracks.artistId,
      slug: tracks.slug,
      featuredArtists: tracks.featuredArtists,
      plays: tracks.plays,
    })
      .from(tracks)
      .where(eq(tracks.artistId, artist.id))
      .orderBy(desc(tracks.plays)),
    db.select({
      id: albums.id,
      title: albums.title,
      coverKey: albums.coverKey,
      coverUrl: albums.coverUrl,
      releaseYear: albums.releaseYear,
      slug: albums.slug,
    })
      .from(albums)
      .where(eq(albums.artistId, artist.id))
      .orderBy(desc(albums.releaseYear)),
    db.select({
      id: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      coverUrl: tracks.coverUrl,
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
      .where(
        and(
          isNotNull(tracks.featuredArtists),
          ilike(tracks.featuredArtists, `%${artist.name}%`)
        )
      )
      .limit(20),
  ]);

  return { artist, rawTracks: rawTracks ?? [], rawAlbums: rawAlbums ?? [], appearsOnTracks: appearsOnTracks ?? [] };
}

function mapTrack(t: any, artistName: string, artistSlug?: string | null, featuredArtists?: string | null): Track & { plays?: number } {
  return {
    id: t.id,
    title: t.title,
    artistId: t.artistId ?? undefined,
    artist: t.artistName ?? artistName,
    artistSlug: t.artistSlug ?? artistSlug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(t.featuredArtists ?? featuredArtists),
    audioUrl: getAudioUrl({ audioKey: t.audioKey }) ?? "",
    coverUrl: getCoverUrl({ coverKey: t.coverKey, coverUrl: t.coverUrl }) ?? undefined,
    duration: t.duration ? Number(t.duration) : undefined,
    slug: t.slug ?? undefined,
    plays: t.plays ?? 0,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getArtistData(id);
  if (!result) return {};
  const { artist, rawTracks } = result;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const artistUrl = `${baseUrl}/artist/${artist.slug || artist.id}`;
  const imageUrl = getCoverUrl({ imageKey: artist.imageKey, imageUrl: artist.imageUrl }) ?? undefined;
  const trackTitles = rawTracks.slice(0, 5).map((t: any) => t.title);
  const trackCount = rawTracks.length;
  const bioExcerpt = artist.bio ? artist.bio.slice(0, 120) : "";
  const songsText = trackTitles.length > 0 ? ` Popular songs: ${trackTitles.join(", ")}.` : "";
  const descBase = bioExcerpt || `Download ${artist.name} latest songs and albums. Stream ${artist.name} new music, mp3 download free.`;

  return {
    title: `${artist.name} - New Songs, MP3 Download & Albums | Zambian Music`,
    description: `${descBase}${songsText} ${trackCount} tracks available. Zambian music on ZedBeatz.`,
    keywords: [
      artist.name, `${artist.name} songs`, `${artist.name} new songs`,
      `${artist.name} mp3 download`, `${artist.name} latest songs 2026`,
      `${artist.name} ft`, `${artist.name} albums`, `${artist.name} music download`,
      `${artist.name} aweah mp3`, `${artist.name} new music 2026`,
      ...trackTitles.map((t: string) => `${artist.name} ${t}`),
      ...trackTitles.map((t: string) => `${t} mp3 download`),
      "Zambian music", "Zambian artist", "Zambia music 2026", "ZedBeatz",
    ].concat([
      "Zambian music streaming", "free Zambian music download", "ZedBeatz Zambian music"
    ]),
    openGraph: {
      title: `${artist.name} - New Songs & Albums | Zambian Music`,
      description: `Stream and download ${artist.name} latest music on ZedBeatz. ${trackCount} tracks available.`,
      url: artistUrl, siteName: "ZedBeatz",
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: `${artist.name} - Zambian Artist`, type: "image/jpeg" }] : [],
      locale: "en_ZM", type: "profile",
      countryName: "Zambia",
    },
    twitter: {
      card: "summary_large_image", title: `${artist.name} - New Songs | Zambian Artist`,
      description: `Download ${artist.name} latest music on ZedBeatz. ${trackCount} songs available.`,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: { canonical: artistUrl },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getArtistData(id);
  if (!result) notFound();
  const { artist, rawTracks, rawAlbums, appearsOnTracks } = result;

  const tracksList = rawTracks.map((t) => mapTrack(t, artist.name, artist.slug, t.featuredArtists));

  const totalPlays = tracksList.reduce((sum, t) => sum + (t.plays ?? 0), 0);

  const appearsOnList: (Track & { plays?: number })[] = appearsOnTracks
    .filter((t) => t.artistId !== artist.id)
    .map((t) => mapTrack(t, t.artistName ?? "Unknown", t.artistSlug, t.featuredArtists));

  const albumsList = (rawAlbums ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    releaseYear: a.releaseYear,
    coverUrl: getCoverUrl({ coverKey: a.coverKey, coverUrl: a.coverUrl }),
  }));

  const artistData = {
    id: artist.id,
    name: artist.name,
    bio: artist.bio,
    imageUrl: getCoverUrl({ imageKey: artist.imageKey, imageUrl: artist.imageUrl }),
    slug: artist.slug,
    trackCount: tracksList.length,
    albumCount: albumsList.length,
    totalPlays,
  };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const artistUrl = `${baseUrl}/artist/${artist.slug || artist.id}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
        { "@type": "ListItem", "position": 2, "name": "Artists", "item": `${baseUrl}/browse` },
        { "@type": "ListItem", "position": 3, "name": artist.name, "item": artistUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      name: artist.name,
      url: artistUrl,
      ...(artist.bio && { description: artist.bio }),
      ...(artistData.imageUrl && { image: [{ "@type": "ImageObject", url: artistData.imageUrl, caption: artist.name }] }),
      genre: "Zambian Music",
      areaServed: "ZM",
      ...(albumsList.length > 0 && {
        album: albumsList.map((al) => ({
          "@type": "MusicAlbum",
          name: al.title,
          ...(al.releaseYear && { datePublished: `${al.releaseYear}` }),
          ...(al.coverUrl && { image: al.coverUrl }),
          url: `${baseUrl}/album/${al.slug || al.id}`,
        })),
      }),
      track: tracksList.map((t) => ({
        "@type": "MusicRecording",
        name: t.title,
        ...(t.duration && { duration: `PT${Math.floor(t.duration)}S` }),
        url: `${baseUrl}/track/${t.slug || t.id}`,
      })),
      ...(tracksList.length > 0 && { numTracks: tracksList.length }),
    },
  ];

  return (
    <div className="pb-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArtistHeader artist={artistData} tracks={tracksList} />

      {tracksList.length === 0 ? (
        <div className="px-5 md:px-10 py-16 text-center">
          <p className="text-[var(--muted)] text-sm">No tracks available yet.</p>
        </div>
      ) : (
        <ArtistPageClient
          tracks={tracksList}
          albums={albumsList}
          appearsOn={appearsOnList}
          artist={artistData}
        />
      )}
    </div>
  );
}
