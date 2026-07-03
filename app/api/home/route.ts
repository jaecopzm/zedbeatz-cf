import { db } from "@/lib/db/drizzle";
import { heroTracks, tracks, artists, albums, playlists } from "@/lib/db/schema";
import { getCoverUrl, getAudioUrl } from "@/lib/cdn";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextResponse } from "next/server";
import { eq, desc, asc, isNotNull, sql, and } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function mapTrack(r: any) {
  return {
    id: r.id,
    title: r.title,
    artistId: r.artistId ?? undefined,
    artist: r.artistName ?? "Unknown",
    artistSlug: r.artistSlug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(r.featuredArtists),
    audioUrl: getAudioUrl({ audioKey: r.audioKey, isrc: r.isrc }) ?? "",
    coverUrl: getCoverUrl({ coverKey: r.coverKey, coverUrl: r.coverUrl }),
    duration: r.duration ?? undefined,
    slug: r.slug ?? undefined,
  };
}

async function getHomeData() {
  const [heroRes, trendingRes, latestRes, artistsRes, albumsRes, playlistsRes] = await Promise.all([
    db
      .select({
        position: heroTracks.position,
        id: tracks.id,
        title: tracks.title,
        audioKey: tracks.audioKey,
        isrc: tracks.isrc,
        coverKey: tracks.coverKey,
        coverUrl: tracks.coverUrl,
        duration: tracks.duration,
        slug: tracks.slug,
        featuredArtists: tracks.featuredArtists,
        artistId: tracks.artistId,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(heroTracks)
      .leftJoin(tracks, eq(heroTracks.trackId, tracks.id))
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(asc(heroTracks.position))
      .limit(5),
    db
      .select({
        id: tracks.id,
        title: tracks.title,
        audioKey: tracks.audioKey,
        isrc: tracks.isrc,
        coverKey: tracks.coverKey,
        coverUrl: tracks.coverUrl,
        duration: tracks.duration,
        slug: tracks.slug,
        featuredArtists: tracks.featuredArtists,
        artistId: tracks.artistId,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(desc(tracks.plays))
      .limit(8),
    db
      .select({
        id: tracks.id,
        title: tracks.title,
        audioKey: tracks.audioKey,
        isrc: tracks.isrc,
        coverKey: tracks.coverKey,
        coverUrl: tracks.coverUrl,
        duration: tracks.duration,
        slug: tracks.slug,
        featuredArtists: tracks.featuredArtists,
        artistId: tracks.artistId,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .orderBy(desc(tracks.createdAt))
      .limit(20),
    db
      .select({
        id: artists.id,
        name: artists.name,
        slug: artists.slug,
        imageKey: artists.imageKey,
      })
      .from(artists)
      .limit(40),
    db
      .select({
        id: albums.id,
        title: albums.title,
        coverKey: albums.coverKey,
        releaseYear: albums.releaseYear,
        slug: albums.slug,
        artistName: artists.name,
        artistSlug: artists.slug,
      })
      .from(albums)
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .orderBy(desc(albums.releaseYear))
      .limit(20),
    db
      .select({
        id: playlists.id,
        name: playlists.name,
        coverKey: playlists.coverKey,
        category: playlists.category,
      })
      .from(playlists)
      .where(eq(playlists.isFeatured, true))
      .orderBy(desc(playlists.createdAt))
      .limit(20),
  ]);

  const heroTracksMapped = heroRes.map((r) => mapTrack(r));

  const trending = trendingRes.map(mapTrack);
  const latest = latestRes.map(mapTrack);

  const PRIORITY = ["Yo Maps", "Chile One", "Slapdee", "Chef 187", "Macky 2", "Kell Kay", "Dizmo", "Drifta Trek"];
  const artistsMapped = artistsRes
    .sort((a, b) => {
      const ai = PRIORITY.findIndex(p => a.name.toLowerCase().includes(p.toLowerCase()));
      const bi = PRIORITY.findIndex(p => b.name.toLowerCase().includes(p.toLowerCase()));
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 20)
    .map((a: any) => ({ id: a.id, name: a.name, slug: a.slug, coverUrl: getCoverUrl({ imageKey: a.imageKey }) }));

  const albumsMapped = albumsRes.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    releaseYear: a.releaseYear ?? null,
    artistName: a.artistName ?? "Unknown",
    artistSlug: a.artistSlug ?? null,
    coverUrl: getCoverUrl({ coverKey: a.coverKey }),
  }));

  const playlistsMapped = playlistsRes.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    coverUrl: getCoverUrl({ coverKey: p.coverKey }),
  }));

  const [featuredAlbum] = await db
    .select({
      id: albums.id,
      title: albums.title,
      slug: albums.slug,
      coverKey: albums.coverKey,
      releaseYear: albums.releaseYear,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(albums)
    .leftJoin(artists, eq(albums.artistId, artists.id))
    .where(eq(albums.isFeatured, true))
    .limit(1);

  const featuredAlbumMapped = featuredAlbum
    ? {
        id: featuredAlbum.id,
        title: featuredAlbum.title,
        slug: featuredAlbum.slug,
        releaseYear: featuredAlbum.releaseYear,
        artistName: featuredAlbum.artistName ?? "Unknown",
        artistSlug: featuredAlbum.artistSlug ?? null,
        coverUrl: getCoverUrl({ coverKey: featuredAlbum.coverKey }),
      }
    : null;

  return {
    heroTracks: heroTracksMapped,
    trending,
    latest,
    artists: artistsMapped,
    albums: albumsMapped,
    playlists: playlistsMapped,
    featuredAlbum: featuredAlbumMapped,
  };
}

export async function GET() {
  const data = await getHomeData();
  return NextResponse.json(data);
}
