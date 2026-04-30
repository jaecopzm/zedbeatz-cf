import { supabase } from "@/lib/db";
import type { Database } from "@/lib/db/database.types";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type TrackRow = Database["public"]["Tables"]["tracks"]["Row"];
type ArtistRow = Database["public"]["Tables"]["artists"]["Row"];
type RecentlyPlayedRow = Database["public"]["Tables"]["recently_played"]["Row"];

type StatsTrack = {
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
  plays: number;
};

type PlayedTrackDuration = {
  id: number;
  audioUrl: string;
  duration?: number;
  plays: number;
};

type StatsArtist = {
  id: number;
  name: string;
  slug: string | null;
  imageUrl?: string | null;
  plays: number;
};

type TrackWithArtist = Pick<
  TrackRow,
  "id" | "title" | "audio_key" | "cover_key" | "duration" | "artist_id" | "slug" | "featured_artists"
> & {
  artists: Pick<ArtistRow, "name" | "slug"> | null;
};

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get plays with timestamps to deduplicate
  const { data: plays, error } = await supabase
    .from("recently_played")
    .select("track_id, played_at")
    .eq("user_id", userId)
    .order("played_at", { ascending: false });

  if (error || !plays) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }

  if (plays.length === 0) {
    return NextResponse.json({
      totalListeningTime: 0,
      totalPlays: 0,
      topTracks: [],
      topArtists: []
    });
  }

  // Deduplicate plays within 30 seconds of each other (same track)
  const trackCounts: Record<number, number> = {};
  const seenRecently = new Map<number, number>(); // trackId -> last timestamp
  const validPlays: RecentlyPlayedRow[] = [];

  for (const play of plays as RecentlyPlayedRow[]) {
    const tid = play.track_id;
    if (typeof tid !== "number" || !play.played_at) continue;

    const playTime = new Date(play.played_at).getTime();
    const lastPlay = seenRecently.get(tid);

    // Only count if it's been more than 30 seconds since last play of this track
    if (!lastPlay || playTime - lastPlay > 30000) {
      trackCounts[tid] = (trackCounts[tid] || 0) + 1;
      seenRecently.set(tid, playTime);
      validPlays.push(play);
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

  const { data: tracksData, error: tracksError } = await supabase
    .from("tracks")
    .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)")
    .in("id", playedTrackIds);

  if (tracksError || !tracksData) {
    return NextResponse.json({ error: "Failed to fetch track details" }, { status: 500 });
  }

  const tracksById = new Map<number, TrackWithArtist>(
    tracksData.map((track) => [track.id, track as TrackWithArtist])
  );

  // Calculate actual listening time based on time between plays
  let totalListeningTime = 0;
  const artistCounts: Record<number, number> = {};

  // Sort valid plays by time (oldest first) to calculate durations
  const sortedPlays = [...validPlays].sort((a, b) => {
    if (!a.played_at || !b.played_at) return 0;
    return new Date(a.played_at).getTime() - new Date(b.played_at).getTime();
  });

  for (let i = 0; i < sortedPlays.length; i++) {
    const play = sortedPlays[i];
    const trackId = play.track_id;
    if (typeof trackId !== "number" || !play.played_at) continue;

    const track = tracksById.get(trackId);
    if (!track) continue;

    const trackDuration = track.duration ?? 180; // default 3 min if unknown
    
    // Calculate actual listen time
    let listenTime = trackDuration;
    
    if (i < sortedPlays.length - 1 && sortedPlays[i + 1].played_at) {
      // Not the last play - calculate time until next play
      const currentTime = new Date(play.played_at).getTime();
      const nextTime = new Date(sortedPlays[i + 1].played_at!).getTime();
      const timeDiff = (nextTime - currentTime) / 1000; // in seconds
      
      // Use the minimum of track duration or time until next play
      listenTime = Math.min(trackDuration, timeDiff);
    } else {
      // Last play - assume they listened for at least 30 seconds or full duration
      listenTime = Math.min(trackDuration, 30);
    }

    totalListeningTime += listenTime;

    if (typeof track.artist_id === "number") {
      artistCounts[track.artist_id] = (artistCounts[track.artist_id] || 0) + 1;
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

  const topTracks: StatsTrack[] = topTrackIds.flatMap((id) => {
    const track = tracksById.get(id);
    if (!track) return [];

    return [
      {
        id: track.id,
        title: track.title,
        artistId: track.artist_id ?? undefined,
        artist: track.artists?.name ?? "Unknown",
        artistSlug: track.artists?.slug,
        featuredArtists: sanitizeFeaturedArtists(track.featured_artists),
        audioUrl: getPublicUrl(track.audio_key),
        coverUrl: track.cover_key ? getPublicUrl(track.cover_key) : null,
        duration: track.duration ?? undefined,
        slug: track.slug,
        plays: trackCounts[id],
      },
    ];
  });

  const playedTracks: PlayedTrackDuration[] = playedTrackIds.flatMap((id) => {
    const track = tracksById.get(id);
    if (!track) return [];

    return [
      {
        id: track.id,
        audioUrl: getPublicUrl(track.audio_key),
        duration: track.duration ?? undefined,
        plays: trackCounts[id],
      },
    ];
  });

  let topArtists: StatsArtist[] = [];
  if (topArtistIds.length > 0) {
    const { data: artistsData, error: artistsError } = await supabase
      .from("artists")
      .select("id, name, slug, image_key")
      .in("id", topArtistIds);

    if (artistsError) {
      return NextResponse.json({ error: "Failed to fetch artist details" }, { status: 500 });
    }

    if (artistsData) {
      const artistsById = new Map<number, ArtistRow>(
        artistsData.map((artist) => [artist.id, artist as ArtistRow])
      );

      topArtists = topArtistIds.map((id) => {
        const artist = artistsById.get(id);
        if (!artist) return null;

        return {
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          imageUrl: artist.image_key ? getPublicUrl(artist.image_key) : null,
          plays: artistCounts[id],
        } as StatsArtist;
      }).filter((artist): artist is StatsArtist => artist !== null);
    }
  }

  return NextResponse.json({
    totalListeningTime, // in seconds
    totalPlays: Object.values(trackCounts).reduce((sum, count) => sum + count, 0),
    topTracks,
    topArtists,
    playedTracks,
  });
}
