import { notFound } from "next/navigation";
import { db } from "@/lib/db/drizzle";
import { tracks, artists, albums } from "@/lib/db/schema";
import { eq, ne, and, desc, gt } from "drizzle-orm";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import type { Metadata } from "next";
import TrackPageClient from "./client";

async function getTrackData(id: string) {
  const whereClause = isNaN(Number(id)) ? eq(tracks.slug, id) : eq(tracks.id, Number(id));

  const [trackResult] = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      coverUrl: tracks.coverUrl,
      duration: tracks.duration,
      artistId: tracks.artistId,
      albumId: tracks.albumId,
      genre: tracks.genre,
      plays: tracks.plays,
      featuredArtists: tracks.featuredArtists,
      createdAt: tracks.createdAt,
      lyrics: tracks.lyrics,
      syncedLyrics: tracks.syncedLyrics,
      slug: tracks.slug,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(whereClause)
    .limit(1);

  if (!trackResult) return null;

  const data = {
    id: trackResult.id,
    title: trackResult.title,
    audio_key: trackResult.audioKey,
    cover_key: trackResult.coverKey,
    cover_url: trackResult.coverUrl,
    duration: trackResult.duration ? Number(trackResult.duration) : null,
    artist_id: trackResult.artistId,
    album_id: trackResult.albumId,
    genre: trackResult.genre,
    plays: trackResult.plays,
    featured_artists: trackResult.featuredArtists,
    created_at: trackResult.createdAt,
    lyrics: trackResult.lyrics,
    synced_lyrics: trackResult.syncedLyrics,
    slug: trackResult.slug,
    artists: trackResult.artistName ? { name: trackResult.artistName, slug: trackResult.artistSlug } : null,
  };

  const [artistTracksResult, albumData] = await Promise.all([
    db
      .select({
        id: tracks.id,
        title: tracks.title,
        coverKey: tracks.coverKey,
        coverUrl: tracks.coverUrl,
        audioKey: tracks.audioKey,
        duration: tracks.duration,
        slug: tracks.slug,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .where(
        and(
          eq(tracks.artistId, trackResult.artistId ?? 0),
          ne(tracks.id, trackResult.id),
        ),
      )
      .limit(5),
    data.album_id
      ? db
          .select({ id: albums.id, title: albums.title, slug: albums.slug })
          .from(albums)
          .where(eq(albums.id, data.album_id))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  const artistTracks = artistTracksResult.map((r) => ({
    id: r.id,
    title: r.title,
    cover_key: r.coverKey,
    cover_url: r.coverUrl,
    audio_key: r.audioKey,
    duration: r.duration,
    slug: r.slug,
    artists: r.artistName ? { name: r.artistName, slug: r.artistSlug } : null,
  }));

  return { data, artistTracks, album: albumData };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getTrackData(id);
  if (!result) return {};
  const { data } = result;

  const artist = (data.artists as unknown as { name: string } | null)?.name ?? "Unknown";
  const rawFeatMeta = data.featured_artists;
  const featuredArtists = typeof rawFeatMeta === 'string' && rawFeatMeta && rawFeatMeta !== 'false' && rawFeatMeta !== 'null' ? rawFeatMeta : '';
  const fullArtist = featuredArtists ? `${artist} feat. ${featuredArtists}` : artist;
  const genre = data.genre || "Music";
  const coverUrl = getCoverUrl({ coverKey: data.cover_key, coverUrl: data.cover_url }) ?? undefined;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const trackUrl = `${baseUrl}/track/${data.slug || id}`;

  const year = data.created_at ? new Date(data.created_at).getFullYear() : new Date().getFullYear();
  const keywords = [
    `${data.title} mp3 download`, `${artist} ${data.title}`,
    `${artist} ft ${featuredArtists || 'new song'}`, `${data.title} aweah mp3 download`,
    `${artist} new songs`, `${artist} latest songs`, `${data.title} download`,
    `${artist} mp3 download`, `${data.title} ${year}`,
    data.title, artist, fullArtist, genre, `${genre} music Zambia`,
    "ZedBeatz", "Zambian music", "Zambian music download", "aweah mp3",
    `${artist} songs`, `${data.title} mp3`, `${artist} ${data.title} mp3`,
    `download ${data.title} by ${artist}`, `Zambia music ${year}`,
    `${data.title} audio`, `listen to ${data.title}`, `${genre} songs Zambia`,
  ];

  if (typeof featuredArtists === 'string' && featuredArtists) {
    const featArtists = featuredArtists.split(/[,&]/).map((a: string) => a.trim());
    keywords.push(...featArtists);
    featArtists.forEach(fa => keywords.push(`${artist} ft ${fa}`, `${artist} ft ${fa} mp3 download`, `${artist} ft ${fa} ${year}`));
  }

  keywords.push(
    "Zambian music streaming", "free Zambian music download", "ZedBeatz Zambian music"
  );

  const descPrefix = featuredArtists
    ? `${data.title} by ${artist} feat. ${featuredArtists}`
    : `${data.title} by ${artist}`;
  const desc = `Stream and download ${descPrefix}. ${genre} track from Zambia${year ? ` (${year})` : ""}. Listen online or download MP3 free on ZedBeatz.`;

  return {
    title: `${data.title} — ${fullArtist} | ${genre} MP3 Download`,
    description: desc,
    keywords,
    authors: [{ name: artist }], creator: artist, publisher: "ZedBeatz",
    openGraph: {
      title: `${data.title} — ${fullArtist} | Zambian Music`,
      description: `Listen to ${data.title} by ${fullArtist} on ZedBeatz. ${genre} music from Zambia.`,
      url: trackUrl, siteName: "ZedBeatz",
      images: coverUrl ? [{ url: coverUrl, secureUrl: coverUrl, width: 1200, height: 1200, alt: `${data.title} by ${fullArtist} - Zambian Music`, type: "image/jpeg" }] : [],
      locale: "en_ZM", type: "music.song",
      countryName: "Zambia",
    },
    twitter: {
      card: "summary_large_image", title: `${data.title} — ${fullArtist} | Zambian Music`,
      description: `Listen to ${data.title} by ${fullArtist} on ZedBeatz.`,
      images: coverUrl ? [coverUrl] : [], site: "@ZedBeatz", creator: "@ZedBeatz",
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
    alternates: { canonical: trackUrl },
  };
}

export async function generateStaticParams() {
  try {
    const topTracks = await db
      .select({ id: tracks.id, slug: tracks.slug })
      .from(tracks)
      .where(gt(tracks.plays, 0))
      .orderBy(desc(tracks.plays))
      .limit(50);

    if (!topTracks.length) return [];

    return topTracks.map((track) => ({
      id: track.slug || track.id.toString(),
    }));
  } catch {
    return [];
  }
}

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTrackData(id);
  if (!result) notFound();
  const { data, artistTracks, album: albumData } = result;

  const artist = (data.artists as unknown as { name: string } | null)?.name ?? "Unknown";
  const artistSlug = (data.artists as unknown as { slug: string } | null)?.slug;
  const rawFeat = data.featured_artists;
  const featuredArtists = typeof rawFeat === 'string' && rawFeat && rawFeat !== 'false' && rawFeat !== 'null' ? rawFeat : '';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";
  const trackUrl = `${baseUrl}/track/${data.slug || data.id}`;
  const coverUrl = getCoverUrl({ coverKey: data.cover_key, coverUrl: data.cover_url }) ?? undefined;

  const moreFromArtist = (artistTracks ?? []).map(r => ({
    id: r.id,
    title: r.title,
    artist: (r.artists as any)?.name ?? "Unknown",
    artistSlug: (r.artists as any)?.slug ?? null,
    coverUrl: getCoverUrl({ coverKey: r.cover_key, coverUrl: r.cover_url }) ?? undefined,
    audioUrl: getAudioUrl({ audioKey: r.audio_key }) ?? "",
    duration: r.duration ? Number(r.duration) : undefined,
    slug: r.slug ?? undefined,
  }));

  const track = {
    id: data.id, title: data.title, artistId: data.artist_id ?? undefined,
    artist: artist,
    artistSlug: artistSlug,
    featuredArtists: featuredArtists,
    audioUrl: getAudioUrl({ audioKey: data.audio_key }) ?? "",
    coverUrl: coverUrl,
    duration: data.duration ? Number(data.duration) : undefined,
    genre: data.genre, plays: data.plays, slug: data.slug ?? undefined,
    lyrics: data.lyrics ?? null,
    syncedLyrics: data.synced_lyrics ?? null,
    releaseYear: data.created_at ? new Date(data.created_at).getFullYear() : new Date().getFullYear(),
    moreFromArtist,
  };

  const datePublished = data.created_at ? new Date(data.created_at).toISOString() : undefined;

  const musicRecordingLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": trackUrl,
    "name": data.title,
    "byArtist": {
      "@type": "MusicGroup",
      "name": artist,
      "url": artistSlug ? `${baseUrl}/artist/${artistSlug}` : undefined,
    },
    "duration": data.duration ? `PT${Number(data.duration)}S` : undefined,
    "genre": data.genre || "Zambian Music",
    "image": coverUrl,
    "url": trackUrl,
    "inLanguage": "en-ZM",
    "datePublished": datePublished,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/ListenAction",
      "userInteractionCount": data.plays || 0,
    },
  };

  if (albumData && (albumData as unknown as { slug: string; title: string; id: number })) {
    const ad = albumData as unknown as { slug: string; title: string; id: number };
    musicRecordingLd["inAlbum"] = {
      "@type": "MusicAlbum",
      "name": ad.title,
      "url": `${baseUrl}/album/${ad.slug || ad.id}`,
    };
  }

  const jsonLd = [
    musicRecordingLd,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
        { "@type": "ListItem", "position": 2, "name": artist, "item": artistSlug ? `${baseUrl}/artist/${artistSlug}` : `${baseUrl}/search?q=${encodeURIComponent(artist)}` },
        { "@type": "ListItem", "position": 3, "name": data.title, "item": trackUrl },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackPageClient track={track} />
    </>
  );
}
