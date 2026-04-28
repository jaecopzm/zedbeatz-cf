import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get("trackId");
  const takeParam = searchParams.get("take");
  const exclude = new Set(parseIdList(searchParams.get("exclude")));

  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId" }, { status: 400 });
  }

  const take = Math.max(1, Math.min(50, takeParam ? Number(takeParam) : 25));

  // Get the seed track
  const { data: seedTrack } = await supabase
    .from("tracks")
    .select("id, artist_id, genre")
    .eq("id", parseInt(trackId))
    .single();

  if (!seedTrack) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  if (typeof seedTrack.artist_id !== "number") {
    return NextResponse.json({ error: "Seed track missing artist" }, { status: 400 });
  }

  exclude.add(seedTrack.id);

  // Spotify-ish shape:
  // - start with more from the same artist
  // - then mix in same-genre tracks from other artists
  // - if genre is empty or results are thin, fallback to popular tracks

  const artistLimit = Math.min(20, Math.max(6, Math.ceil(take * 0.4)));
  const otherLimit = Math.min(40, Math.max(10, take * 2));

  const { data: artistTracks } = await supabase
    .from("tracks")
    .select(
      "id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, plays, artists(name, slug)"
    )
    .eq("artist_id", seedTrack.artist_id)
    .not("audio_key", "is", null)
    .neq("id", seedTrack.id)
    .order("plays", { ascending: false })
    .limit(artistLimit);

  // Fetch genre tracks (different artists)
  let genreTracks: any[] = [];
  if (seedTrack.genre) {
    const result = await supabase
      .from("tracks")
      .select(
        "id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, plays, artists(name, slug)"
      )
      .eq("genre", seedTrack.genre)
      .not("audio_key", "is", null)
      .neq("artist_id", seedTrack.artist_id)
      .order("plays", { ascending: false })
      .limit(otherLimit);
    genreTracks = result.data ?? [];
  }

  // Fallback: popular tracks across the catalog if we don't have enough.
  let fallbackTracks: any[] = [];
  if ((artistTracks?.length ?? 0) + (genreTracks?.length ?? 0) < take) {
    const result = await supabase
      .from("tracks")
      .select(
        "id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, plays, artists(name, slug)"
      )
      .not("audio_key", "is", null)
      .neq("artist_id", seedTrack.artist_id)
      .order("plays", { ascending: false })
      .limit(otherLimit);
    fallbackTracks = result.data ?? [];
  }

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

  // Keep "more from artist" first, then genre mix, then fallback.
  const ordered = [
    ...pickUnique(artistTracks ?? []),
    ...pickUnique(genreTracks ?? []),
    ...pickUnique(fallbackTracks ?? []),
  ].slice(0, take);

  const radioTracks: RadioTrack[] = ordered.map((t: any) => ({
    id: t.id,
    title: t.title,
    artistId: t.artist_id ?? undefined,
    artist: t.artists?.name ?? "Unknown",
    artistSlug: t.artists?.slug,
    featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
    audioUrl: getPublicUrl(t.audio_key),
    coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : null,
    duration: t.duration ?? undefined,
    slug: t.slug,
  }));

  return NextResponse.json({
    tracks: radioTracks,
    meta: {
      seed: { id: seedTrack.id, artistId: seedTrack.artist_id, genre: seedTrack.genre ?? null },
      counts: {
        artist: artistTracks?.length ?? 0,
        genre: genreTracks?.length ?? 0,
        fallback: fallbackTracks?.length ?? 0,
        returned: radioTracks.length,
      },
    },
  });
}
