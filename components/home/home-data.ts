import { db } from "@/lib/db/drizzle";
import { tracks, artists, albums, playlists, heroTracks } from "@/lib/db/schema";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { eq, desc, asc, and, isNotNull, ne } from "drizzle-orm";
import type { Track } from "@/lib/player-store";
import type { RadioStation } from "@/components/home/radio-stations";

export function mapTrack(r: any): Track {
  const audioUrl = getAudioUrl({
    isrc:      r.isrc,
    deezerId:  r.deezerId,
    spotifyId: r.spotifyId,
    audioKey:  r.audioKey,
  });
  const coverUrl = getCoverUrl({
    coverUrl: r.coverUrl,
    coverKey: r.coverKey,
  });
  return {
    id: r.id, title: r.title, artistId: r.artistId ?? undefined,
    artist: r.artistName ?? "Unknown",
    artistSlug: r.artistSlug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(r.featuredArtists),
    isrc: r.isrc ?? undefined,
    deezerId: r.deezerId ?? undefined,
    spotifyId: r.spotifyId ?? undefined,
    audioUrl: audioUrl ?? "",
    coverUrl: coverUrl ?? undefined,
    duration: r.duration ? Number(r.duration) : undefined,
    slug: r.slug ?? undefined,
    status: r.status ?? undefined,
  };
}

// Shared track columns — include all CDN identifiers + legacy R2 keys
export const trackCols = {
  id: tracks.id,
  title: tracks.title,
  audioKey: tracks.audioKey,
  coverKey: tracks.coverKey,
  coverUrl: tracks.coverUrl,
  isrc: tracks.isrc,
  deezerId: tracks.deezerId,
  spotifyId: tracks.spotifyId,
  duration: tracks.duration,
  slug: tracks.slug,
  featuredArtists: tracks.featuredArtists,
  artistId: tracks.artistId,
  status: tracks.status,
} as const;

export type FeaturedAlbum = {
  id: number; title: string; slug: string | null; releaseYear: number | null;
  artistName: string; artistSlug: string | null; coverUrl: string | null;
};

const PRIORITY = ["Yo Maps", "Chile One", "Slapdee", "Chef 187", "Macky 2", "Kell Kay", "Dizmo", "Drifta Trek"];

export async function getHeroData(): Promise<{ hero: Track[]; featuredAlbum: FeaturedAlbum | null; fallback: Track[] }> {
  const [heroRes, latestRes, featuredAlbumRes] = await Promise.all([
    db
      .select({ position: heroTracks.position, ...trackCols, artistName: artists.name, artistSlug: artists.slug })
      .from(heroTracks)
      .leftJoin(tracks, eq(heroTracks.trackId, tracks.id))
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(asc(heroTracks.position))
      .limit(5),
    db
      .select({ ...trackCols, artistName: artists.name, artistSlug: artists.slug })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(desc(tracks.createdAt))
      .limit(5),
    db
      .select({
        id: albums.id, title: albums.title, coverKey: albums.coverKey, coverUrl: albums.coverUrl,
        releaseYear: albums.releaseYear, slug: albums.slug, artistName: artists.name, artistSlug: artists.slug,
      })
      .from(albums)
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .where(eq(albums.isFeatured, true))
      .limit(1),
  ]);
  const fa = featuredAlbumRes[0];
  return {
    hero: heroRes.map(mapTrack),
    fallback: latestRes.map(mapTrack),
    featuredAlbum: fa ? {
      id: fa.id, title: fa.title, slug: fa.slug,
      releaseYear: fa.releaseYear,
      artistName: fa.artistName ?? "Unknown",
      artistSlug: fa.artistSlug ?? null,
      coverUrl: getCoverUrl({ coverUrl: fa.coverUrl, coverKey: fa.coverKey }),
    } : null,
  };
}

export async function getTrending(): Promise<Track[]> {
  const res = await db
    .select({ ...trackCols, artistName: artists.name, artistSlug: artists.slug })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .orderBy(desc(tracks.plays))
    .limit(20);
  return res.map(mapTrack);
}

export async function getLatest(): Promise<Track[]> {
  const res = await db
    .select({ ...trackCols, artistName: artists.name, artistSlug: artists.slug })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .orderBy(desc(tracks.createdAt))
    .limit(20);
  return res.map(mapTrack);
}

export type HomeArtist = { id: number; name: string; slug: string | null; coverUrl: string | null };

export async function getArtists(): Promise<HomeArtist[]> {
  const res = await db
    .select({ id: artists.id, name: artists.name, slug: artists.slug, imageKey: artists.imageKey, imageUrl: artists.imageUrl })
    .from(artists)
    .limit(40);
  return res
    .sort((a: any, b: any) => {
      const ai = PRIORITY.findIndex((p) => a.name.toLowerCase().includes(p.toLowerCase()));
      const bi = PRIORITY.findIndex((p) => b.name.toLowerCase().includes(p.toLowerCase()));
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 20)
    .map((a: any) => ({ id: a.id, name: a.name, slug: a.slug, coverUrl: getCoverUrl({ imageUrl: a.imageUrl, imageKey: a.imageKey }) }));
}

export type HomeAlbum = { id: number; title: string; slug: string | null; releaseYear: number | null; artistName: string; coverUrl: string | null };

export async function getAlbums(): Promise<HomeAlbum[]> {
  const res = await db
    .select({
      id: albums.id, title: albums.title, coverKey: albums.coverKey, coverUrl: albums.coverUrl,
      releaseYear: albums.releaseYear, slug: albums.slug, artistName: artists.name,
    })
    .from(albums)
    .leftJoin(artists, eq(albums.artistId, artists.id))
    .orderBy(desc(albums.releaseYear))
    .limit(20);
  return res.map((a: any) => ({
    id: a.id, title: a.title, slug: a.slug,
    releaseYear: a.releaseYear ?? null,
    artistName: a.artistName ?? "Unknown",
    coverUrl: getCoverUrl({ coverUrl: a.coverUrl, coverKey: a.coverKey }),
  }));
}

export type HomePlaylist = { id: number; name: string; category: string | null; coverUrl: string | null };

export async function getPlaylists(): Promise<HomePlaylist[]> {
  const res = await db
    .select({ id: playlists.id, name: playlists.name, coverKey: playlists.coverKey, coverUrl: playlists.coverUrl, category: playlists.category })
    .from(playlists)
    .where(eq(playlists.isFeatured, true))
    .orderBy(desc(playlists.createdAt))
    .limit(20);
  return res.map((p: any) => ({
    id: p.id, name: p.name, category: p.category,
    coverUrl: getCoverUrl({ coverUrl: p.coverUrl, coverKey: p.coverKey }),
  }));
}

export async function getRadio(): Promise<RadioStation[]> {
  const res = await db
    .select({
      id: tracks.id, title: tracks.title, audioKey: tracks.audioKey, coverKey: tracks.coverKey,
      slug: tracks.slug, artistId: tracks.artistId, artistName: artists.name, artistSlug: artists.slug,
    })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .orderBy(desc(tracks.plays))
    .limit(120);
  const seen = new Set<number>();
  const stations: RadioStation[] = [];
  for (const t of res) {
    if (!t.artistId || seen.has(t.artistId)) continue;
    seen.add(t.artistId);
    stations.push({
      id: t.id,
      title: t.title,
      artist: t.artistName ?? "Unknown",
      artistSlug: t.artistSlug,
      coverUrl: getCoverUrl({ coverKey: t.coverKey }),
      slug: t.slug,
      name: t.artistName ?? "Unknown",
    });
    if (stations.length >= 10) break;
  }
  return stations;
}

export async function getGenres(): Promise<string[]> {
  const rows = await db
    .select({ genre: tracks.genre })
    .from(tracks)
    .where(and(isNotNull(tracks.genre), ne(tracks.genre, ""), ne(tracks.genre, "null"), ne(tracks.genre, "false")));
  const counts = new Map<string, { count: number; label: string }>();
  for (const r of rows) {
    const g = r.genre?.trim();
    if (!g || g === "" || g === "null" || g === "false") continue;
    const key = g.toLowerCase().replace(/[\s-]+/g, "");
    const existing = counts.get(key);
    if (existing) existing.count++;
    else counts.set(key, { count: 1, label: g });
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((g) => g.label);
}
