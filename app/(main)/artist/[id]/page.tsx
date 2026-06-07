import { notFound } from "next/navigation";
import { db } from "@/lib/db/drizzle";
import { getPublicUrl } from "@/lib/r2";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import ArtistHeader from "@/components/artist/artist-header";
import PopularTracks from "@/components/artist/popular-tracks";
import ArtistAlbums from "@/components/artist/artist-albums";
import ArtistTracks from "@/components/artist/artist-tracks";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { artists, tracks, albums } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

async function getArtistData(id: string) {
  const [artist] = await db.select({
    id: artists.id,
    name: artists.name,
    bio: artists.bio,
    imageKey: artists.imageKey,
    slug: artists.slug,
  })
    .from(artists)
    .where(isNaN(Number(id)) ? eq(artists.slug, id) : eq(artists.id, Number(id)))
    .limit(1);

  if (!artist) return null;

  const [rawTracks, rawAlbums] = await Promise.all([
    db.select({
      id: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
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
      releaseYear: albums.releaseYear,
      slug: albums.slug,
    })
      .from(albums)
      .where(eq(albums.artistId, artist.id))
      .orderBy(desc(albums.releaseYear)),
  ]);

  return { artist, rawTracks: rawTracks ?? [], rawAlbums: rawAlbums ?? [] };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getArtistData(id);
  if (!result) return {};
  const { artist, rawTracks } = result;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const artistUrl = `${baseUrl}/artist/${artist.slug || artist.id}`;
  const imageUrl = artist.imageKey ? getPublicUrl(artist.imageKey) : undefined;
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
  const { artist, rawTracks, rawAlbums } = result;

  const tracksList: (Track & { plays?: number })[] = (rawTracks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    artistId: t.artistId ?? undefined,
    artist: artist.name,
    artistSlug: artist.slug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(t.featuredArtists),
    audioUrl: getPublicUrl(t.audioKey),
    coverUrl: t.coverKey ? getPublicUrl(t.coverKey) : undefined,
    duration: t.duration ? Number(t.duration) : undefined,
    slug: t.slug ?? undefined,
    plays: t.plays ?? 0,
  }));

  const totalPlays = tracksList.reduce((sum, t) => sum + (t.plays ?? 0), 0);

  const albumsList = (rawAlbums ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    releaseYear: a.releaseYear,
    coverUrl: a.coverKey ? getPublicUrl(a.coverKey) : null,
  }));

  const artistData = {
    id: artist.id,
    name: artist.name,
    bio: artist.bio,
    imageUrl: artist.imageKey ? getPublicUrl(artist.imageKey) : null,
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
        <>
          <PopularTracks tracks={tracksList.slice(0, 5)} allTracks={tracksList} />
          {albumsList.length > 0 && <ArtistAlbums albums={albumsList} />}
          <ArtistTracks tracks={tracksList} />
        </>
      )}
    </div>
  );
}
