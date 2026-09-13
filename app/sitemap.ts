import { MetadataRoute } from 'next';
import { db } from '@/lib/db/drizzle';
import { tracks, artists, albums, playlists } from '@/lib/db/schema';
import { eq, desc, asc, isNotNull, sql } from 'drizzle-orm';
import { encodeId } from '@/lib/hashids';

export const revalidate = 0;

const BASE_URL = 'https://zedbeatz.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tracksResult, artistsResult, albumsResult, playlistsResult, genresRaw] = await Promise.all([
    db
      .select({ slug: tracks.slug, id: tracks.id, createdAt: tracks.createdAt })
      .from(tracks)
      .orderBy(desc(tracks.createdAt)),
    db
      .select({ slug: artists.slug, id: artists.id, createdAt: artists.createdAt })
      .from(artists)
      .orderBy(asc(artists.name)),
    db
      .select({ slug: albums.slug, id: albums.id, releaseYear: albums.releaseYear, createdAt: albums.createdAt })
      .from(albums)
      .orderBy(desc(albums.releaseYear)),
    db
      .select({ id: playlists.id, createdAt: playlists.createdAt })
      .from(playlists)
      .where(eq(playlists.isFeatured, true))
      .orderBy(desc(playlists.createdAt)),
    db
      .select({ genre: tracks.genre })
      .from(tracks)
      .where(isNotNull(tracks.genre)),
  ]);

  const uniqueGenres = [...new Set(genresRaw.map((g) => g.genre).filter(Boolean) as string[])];

  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${BASE_URL}/browse`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE_URL}/tracks`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${BASE_URL}/stats`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${BASE_URL}/radio`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.2 },
    { url: `${BASE_URL}/dmca`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.2 },
  ];

  const genrePages = uniqueGenres.map((genre) => ({
    url: `${BASE_URL}/browse?genre=${encodeURIComponent(genre.toLowerCase())}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const trackPages = tracksResult.map((t) => ({
    url: `${BASE_URL}/track/${encodeId(t.id)}`,
    lastModified: t.createdAt ? new Date(t.createdAt) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const artistPages = artistsResult.map((a) => ({
    url: `${BASE_URL}/artist/${encodeId(a.id)}`,
    lastModified: a.createdAt ? new Date(a.createdAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const albumPages = albumsResult.map((a) => ({
    url: `${BASE_URL}/album/${encodeId(a.id)}`,
    lastModified: a.createdAt ? new Date(a.createdAt) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const playlistPages = playlistsResult.map((p) => ({
    url: `${BASE_URL}/playlist/${encodeId(p.id)}`,
    lastModified: p.createdAt ? new Date(p.createdAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...genrePages,
    ...trackPages,
    ...artistPages,
    ...albumPages,
    ...playlistPages,
  ];
}
