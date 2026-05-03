import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TRACK_SELECT = "id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)";

function mapTrack(r: any) {
  return {
    id: r.id, title: r.title, artistId: r.artist_id ?? undefined,
    artist: r.artists?.name ?? "Unknown",
    artistSlug: r.artists?.slug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(r.featured_artists),
    audioUrl: getPublicUrl(r.audio_key),
    coverUrl: r.cover_key ? getPublicUrl(r.cover_key) : null,
    duration: r.duration ?? undefined,
    slug: r.slug ?? undefined,
  };
}

async function getHomeData() {
  const [heroRes, trendingRes, latestRes, artistsRes, albumsRes, playlistsRes, featuredAlbumRes] = await Promise.all([
    supabase.from("hero_tracks").select(`position, tracks(${TRACK_SELECT})`).order("position").limit(5),
    supabase.from("tracks").select(TRACK_SELECT).order("plays", { ascending: false }).limit(8),
    supabase.from("tracks").select(TRACK_SELECT).order("created_at", { ascending: false }).limit(20),
    supabase.from("artists").select("id, name, slug, image_key").limit(40),
    supabase.from("albums").select("id, title, cover_key, release_year, slug, artists(name, slug)").order("release_year", { ascending: false }).limit(20),
    supabase.from("playlists").select("id, name, cover_key, category").eq("is_featured", true).order("created_at", { ascending: false }).limit(20),
    (supabase.from("albums") as any).select("id, title, cover_key, release_year, slug, artists(name, slug)").eq("is_featured", true).limit(1).maybeSingle(),
  ]);

  const heroTracks = (heroRes.data ?? []).map((r: any) => mapTrack(r.tracks));
  const trending = (trendingRes.data ?? []).map(mapTrack);
  const latest = (latestRes.data ?? []).map(mapTrack);

  const PRIORITY = ["Yo Maps", "Chile One", "Slapdee", "Chef 187", "Macky 2", "Kell Kay", "Dizmo", "Drifta Trek"];
  const artists = (artistsRes.data ?? [])
    .sort((a, b) => {
      const ai = PRIORITY.findIndex(p => a.name.toLowerCase().includes(p.toLowerCase()));
      const bi = PRIORITY.findIndex(p => b.name.toLowerCase().includes(p.toLowerCase()));
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 20)
    .map((a: any) => ({ id: a.id, name: a.name, slug: a.slug, coverUrl: a.image_key ? getPublicUrl(a.image_key) : null }));

  const albums = (albumsRes.data ?? []).map((a: any) => ({
    id: a.id, title: a.title, slug: a.slug,
    releaseYear: a.release_year ?? null,
    artistName: a.artists?.name ?? "Unknown",
    artistSlug: a.artists?.slug ?? null,
    coverUrl: a.cover_key ? getPublicUrl(a.cover_key) : null,
  }));

  const playlists = (playlistsRes.data ?? []).map((p: any) => ({
    id: p.id, name: p.name, category: p.category,
    coverUrl: p.cover_key ? getPublicUrl(p.cover_key) : null,
  }));

  const fa = featuredAlbumRes.data;
  const featuredAlbum = fa ? {
    id: fa.id, title: fa.title, slug: fa.slug,
    releaseYear: fa.release_year,
    artistName: (fa.artists as any)?.name ?? "Unknown",
    artistSlug: (fa.artists as any)?.slug ?? null,
    coverUrl: fa.cover_key ? getPublicUrl(fa.cover_key) : null,
  } : null;

  return { heroTracks, trending, latest, artists, albums, playlists, featuredAlbum };
}

export async function GET() {
  const data = await getHomeData();
  return NextResponse.json(data);
}
