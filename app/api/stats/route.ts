import { db } from "@/lib/db/drizzle";
import { recentlyPlayed, tracks, artists } from "@/lib/db/schema";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, inArray } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plays = await db
    .select({
      trackId: recentlyPlayed.trackId,
      playedAt: recentlyPlayed.playedAt,
    })
    .from(recentlyPlayed)
    .where(eq(recentlyPlayed.userId, userId))
    .orderBy(desc(recentlyPlayed.playedAt));

  if (plays.length === 0) {
    return NextResponse.json({
      totalListeningTime: 0,
      totalPlays: 0,
      topTracks: [],
      topArtists: [],
    });
  }

  const trackCounts: Record<number, number> = {};
  const seenRecently = new Map<number, number>();
  const validPlays: { trackId: number; playedAt: Date }[] = [];

  for (const play of plays) {
    const tid = play.trackId;
    if (typeof tid !== "number" || !play.playedAt) continue;

    const playTime = new Date(play.playedAt).getTime();
    const lastPlay = seenRecently.get(tid);

    if (!lastPlay || playTime - lastPlay > 30000) {
      trackCounts[tid] = (trackCounts[tid] || 0) + 1;
      seenRecently.set(tid, playTime);
      validPlays.push({ trackId: tid, playedAt: play.playedAt });
    }
  }

  const playedTrackIds = Object.keys(trackCounts).map((id) => Number(id));
  if (playedTrackIds.length === 0) {
    return NextResponse.json({
      totalListeningTime: 0,
      totalPlays: 0,
      topTracks: [],
      topArtists: [],
    });
  }

  const tracksData = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      duration: tracks.duration,
      artistId: tracks.artistId,
      slug: tracks.slug,
      featuredArtists: tracks.featuredArtists,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .where(inArray(tracks.id, playedTrackIds));

  const tracksById = new Map(tracksData.map((track) => [track.id, track]));

  let totalListeningTime = 0;
  const artistCounts: Record<number, number> = {};

  const sortedPlays = [...validPlays].sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());

  for (let i = 0; i < sortedPlays.length; i++) {
    const play = sortedPlays[i];
    const track = tracksById.get(play.trackId);
    if (!track) continue;

    const trackDuration = Number(track.duration) || 180;

    let listenTime = trackDuration;

    if (i < sortedPlays.length - 1) {
      const currentTime = play.playedAt.getTime();
      const nextTime = sortedPlays[i + 1].playedAt.getTime();
      const timeDiff = (nextTime - currentTime) / 1000;
      listenTime = Math.min(trackDuration, timeDiff);
    } else {
      listenTime = Math.min(trackDuration, 30);
    }

    totalListeningTime += listenTime;

    if (typeof track.artistId === "number") {
      artistCounts[track.artistId] = (artistCounts[track.artistId] || 0) + 1;
    }
  }

  const topTrackIds = Object.entries(trackCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => Number(id));

  const topArtistIds = Object.entries(artistCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => Number(id));

  const topTracks = topTrackIds.flatMap((id) => {
    const track = tracksById.get(id);
    if (!track) return [];

    return [{
      id: track.id,
      title: track.title,
      artistId: track.artistId ?? undefined,
      artist: track.artistName ?? "Unknown",
      artistSlug: track.artistSlug,
      featuredArtists: sanitizeFeaturedArtists(track.featuredArtists),
      audioUrl: getPublicUrl(track.audioKey),
      coverUrl: track.coverKey ? getPublicUrl(track.coverKey) : null,
      duration: track.duration ?? undefined,
      slug: track.slug,
      plays: trackCounts[id],
    }];
  });

  let topArtists: any[] = [];
  if (topArtistIds.length > 0) {
    const artistsData = await db
      .select({
        id: artists.id,
        name: artists.name,
        slug: artists.slug,
        imageKey: artists.imageKey,
      })
      .from(artists)
      .where(inArray(artists.id, topArtistIds));

    const artistsById = new Map(artistsData.map((a) => [a.id, a]));

    topArtists = topArtistIds.map((id) => {
      const artist = artistsById.get(id);
      if (!artist) return null;
      return {
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        imageUrl: artist.imageKey ? getPublicUrl(artist.imageKey) : null,
        plays: artistCounts[id],
      };
    }).filter(Boolean);
  }

  return NextResponse.json({
    totalListeningTime,
    totalPlays: Object.values(trackCounts).reduce((sum, count) => sum + count, 0),
    topTracks,
    topArtists,
    playedTracks: playedTrackIds.flatMap((id) => {
      const track = tracksById.get(id);
      if (!track) return [];
      return [{
        id: track.id,
        audioUrl: getPublicUrl(track.audioKey),
        duration: track.duration ?? undefined,
        plays: trackCounts[id],
      }];
    }),
  });
}
