import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import type { Track } from "@/lib/player-store";
import type { Metadata } from "next";
import ArtistHeader from "@/components/artist/artist-header";
import PopularTracks from "@/components/artist/popular-tracks";
import ArtistAlbums from "@/components/artist/artist-albums";
import ArtistTracks from "@/components/artist/artist-tracks";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";

async function getArtistData(id: string) {
  return unstable_cache(async () => {
    let artistQuery = supabase.from("artists").select("id, name, bio, image_key, slug");
    artistQuery = isNaN(Number(id)) ? artistQuery.eq("slug", id) : artistQuery.eq("id", Number(id));
    const { data: artist } = await artistQuery.single();
    if (!artist) return null;

    const [{ data: rawTracks }, { data: rawAlbums }] = await Promise.all([
      supabase.from("tracks").select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, plays").eq("artist_id", artist.id).order("plays", { ascending: false }),
      supabase.from("albums").select("id, title, cover_key, release_year, slug").eq("artist_id", artist.id).order("release_year", { ascending: false }),
    ]);

    return { artist, rawTracks: rawTracks ?? [], rawAlbums: rawAlbums ?? [] };
  }, [`artist-${id}`], { revalidate: 300 })();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getArtistData(id);
  if (!result) return {};
  const { artist, rawTracks } = result;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";
  const artistUrl = `${baseUrl}/artist/${artist.slug || artist.id}`;
  const imageUrl = artist.image_key ? getPublicUrl(artist.image_key) : undefined;
  const trackTitles = rawTracks.slice(0, 5).map((t: any) => t.title);
  const songsText = trackTitles.length > 0 ? ` Popular songs: ${trackTitles.join(", ")}.` : "";

  return {
    title: `${artist.name} - New Songs, MP3 Download & Albums | ZedBeatz`,
    description: `Download ${artist.name} latest songs and albums. Stream ${artist.name} new music, mp3 download free.${songsText} Zambian music on ZedBeatz.`,
    keywords: [
      artist.name, `${artist.name} songs`, `${artist.name} new songs`,
      `${artist.name} mp3 download`, `${artist.name} latest songs`,
      `${artist.name} ft`, `${artist.name} albums`, `${artist.name} music download`,
      `${artist.name} aweah mp3`, ...trackTitles.map((t: string) => `${artist.name} ${t}`),
      "Zambian music", "Zambian artist", "ZedBeatz",
    ].join(", "),
    openGraph: {
      title: `${artist.name} - New Songs & Albums`,
      description: `Stream and download ${artist.name} latest music on ZedBeatz`,
      url: artistUrl, siteName: "ZedBeatz",
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: artist.name }] : [],
      locale: "en_ZM", type: "profile",
    },
    twitter: {
      card: "summary_large_image", title: `${artist.name} - New Songs`,
      description: `Download ${artist.name} latest music on ZedBeatz`,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: { canonical: artistUrl },
  };
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getArtistData(id);
  if (!result) notFound();
  const { artist, rawTracks, rawAlbums } = result;

  const tracks: (Track & { plays?: number })[] = (rawTracks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    artistId: t.artist_id ?? undefined,
    artist: artist.name,
    artistSlug: artist.slug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
    audioUrl: getPublicUrl(t.audio_key),
    coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : undefined,
    duration: t.duration ?? undefined,
    slug: t.slug ?? undefined,
    plays: t.plays ?? 0,
  }));

  const totalPlays = tracks.reduce((sum, t) => sum + (t.plays ?? 0), 0);

  const albums = (rawAlbums ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    releaseYear: a.release_year,
    coverUrl: a.cover_key ? getPublicUrl(a.cover_key) : null,
  }));

  const artistData = {
    id: artist.id,
    name: artist.name,
    bio: artist.bio,
    imageUrl: artist.image_key ? getPublicUrl(artist.image_key) : null,
    slug: artist.slug,
    trackCount: tracks.length,
    albumCount: albums.length,
    totalPlays,
  };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";
  const artistUrl = `${baseUrl}/artist/${artist.slug || artist.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.name,
    url: artistUrl,
    ...(artist.bio && { description: artist.bio }),
    ...(artistData.imageUrl && { image: artistData.imageUrl }),
    genre: "Zambian Music",
    ...(albums.length > 0 && {
      album: albums.slice(0, 10).map((a) => ({
        "@type": "MusicAlbum",
        name: a.title,
        ...(a.releaseYear && { datePublished: `${a.releaseYear}` }),
        ...(a.coverUrl && { image: a.coverUrl }),
      })),
    }),
    track: tracks.slice(0, 10).map((t) => ({
      "@type": "MusicRecording",
      name: t.title,
      ...(t.duration && { duration: `PT${Math.floor(t.duration)}S` }),
    })),
  };

  return (
    <div className="min-h-screen pb-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArtistHeader artist={artistData} tracks={tracks} />

      {tracks.length === 0 ? (
        <div className="px-5 md:px-10 py-16 text-center">
          <p className="text-[var(--muted)] text-sm">No tracks available yet.</p>
        </div>
      ) : (
        <>
          <PopularTracks tracks={tracks.slice(0, 5)} allTracks={tracks} />
          {albums.length > 0 && <ArtistAlbums albums={albums} />}
          <ArtistTracks tracks={tracks} />
        </>
      )}
    </div>
  );
}
