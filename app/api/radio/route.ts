import { db } from "@/lib/db/drizzle";
import { tracks, artists } from "@/lib/db/schema";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";
import { eq, ne, and, isNotNull, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RadioTrack = {
  id: number;
  title: string;
  artistId?: number;
  artist: string;
  artistSlug?: string | null;
  featuredArtists?: string;
  audioUrl: string;
  coverUrl?: string | null;
  duration?: number;
  slug?: string | null;
};

function parseIdList(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}

const trackFields = {
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
};

async function fetchTracks(where: any, limit: number) {
  return db
    .select(trackFields)
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(and(isNotNull(tracks.audioKey), where))
    .orderBy(desc(tracks.plays))
    .limit(limit);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get("trackId");
  const takeParam = searchParams.get("take");
  const exclude = new Set(parseIdList(searchParams.get("exclude")));

  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId" }, { status: 400 });
  }

  const take = Math.max(1, Math.min(50, takeParam ? Number(takeParam) : 25));

  const [seedTrack] = await db
    .select({ id: tracks.id, artistId: tracks.artistId, genre: tracks.genre })
    .from(tracks)
    .where(eq(tracks.id, parseInt(trackId)))
    .limit(1);

  if (!seedTrack) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  if (typeof seedTrack.artistId !== "number") {
    return NextResponse.json({ error: "Seed track missing artist" }, { status: 400 });
  }

  exclude.add(seedTrack.id);

  const artistLimit = Math.min(20, Math.max(6, Math.ceil(take * 0.4)));
  const otherLimit = Math.min(40, Math.max(10, take * 2));

  const [artistTracks, genreTracks, fallbackTracks] = await Promise.all([
    fetchTracks(
      and(eq(tracks.artistId, seedTrack.artistId), ne(tracks.id, seedTrack.id)),
      artistLimit
    ),
    seedTrack.genre
      ? fetchTracks(
          and(eq(tracks.genre, seedTrack.genre), ne(tracks.artistId, seedTrack.artistId)),
          otherLimit
        )
      : Promise.resolve([]),
    fetchTracks(
      ne(tracks.artistId, seedTrack.artistId),
      otherLimit
    ),
  ]);

  const pickUnique = (rows: any[]) => {
    const out: any[] = [];
    for (const t of rows ?? []) {
      if (!t?.id || exclude.has(t.id)) continue;
      exclude.add(t.id);
      out.push(t);
      if (out.length >= take) break;
    }
    return out;
  };

  const ordered = [
    ...pickUnique(artistTracks),
    ...pickUnique(genreTracks),
    ...pickUnique(fallbackTracks),
  ].slice(0, take);

  const radioTracks: RadioTrack[] = ordered.map((t: any) => ({
    id: t.id,
    title: t.title,
    artistId: t.artistId ?? undefined,
    artist: t.artistName ?? "Unknown",
    artistSlug: t.artistSlug,
    featuredArtists: sanitizeFeaturedArtists(t.featuredArtists),
    audioUrl: getPublicUrl(t.audioKey),
    coverUrl: t.coverKey ? getPublicUrl(t.coverKey) : null,
    duration: t.duration ?? undefined,
    slug: t.slug,
  }));

  return NextResponse.json({
    tracks: radioTracks,
    meta: {
      seed: { id: seedTrack.id, artistId: seedTrack.artistId, genre: seedTrack.genre ?? null },
      counts: {
        artist: artistTracks.length,
        genre: genreTracks.length,
        fallback: fallbackTracks.length,
        returned: radioTracks.length,
      },
    },
  });
}
