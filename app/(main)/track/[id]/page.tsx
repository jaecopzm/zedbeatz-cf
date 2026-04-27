import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import type { Metadata } from "next";
import TrackPageClient from "./client";

async function getTrackData(id: string) {
  return unstable_cache(async () => {
    let query = supabase.from("tracks").select("id, title, audio_key, cover_key, duration, artist_id, genre, plays, featured_artists, artists(name, slug), slug");
    query = isNaN(Number(id)) ? query.eq("slug", id) : query.eq("id", Number(id));
    const { data, error } = await query.single();
    if (error) {
      if (error.code !== "PGRST116") {
        console.error("Error fetching track data:", error);
        throw error;
      }
      return null;
    }
    if (!data) return null;

    const { data: artistTracks } = await supabase
      .from("tracks")
      .select("id, title, cover_key, audio_key, duration, slug, artists(name, slug)")
      .eq("artist_id", data.artist_id ?? 0)
      .neq("id", data.id)
      .limit(5);

    return { data, artistTracks: artistTracks ?? [] };
  }, [`track-${id}`], { revalidate: 300 })();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getTrackData(id);
  if (!result) return {};
  const { data } = result;
  
  const artist = (data.artists as unknown as { name: string } | null)?.name ?? "Unknown";
  const artistSlug = (data.artists as unknown as { slug: string } | null)?.slug;
  const rawFeatMeta = data.featured_artists;
  const featuredArtists = typeof rawFeatMeta === 'string' && rawFeatMeta && rawFeatMeta !== 'false' && rawFeatMeta !== 'null' ? rawFeatMeta : '';
  const fullArtist = featuredArtists ? `${artist} feat. ${featuredArtists}` : artist;
  const genre = data.genre || "Music";
  const coverUrl = data.cover_key ? getPublicUrl(data.cover_key) : undefined;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";
  const trackUrl = `${baseUrl}/track/${data.slug || id}`;
  
  const keywords = [
    `${data.title} mp3 download`, `${artist} ${data.title}`,
    `${artist} ft ${featuredArtists || 'new song'}`, `${data.title} aweah mp3 download`,
    `${artist} new songs`, `${artist} latest songs`, `${data.title} download`,
    `${artist} mp3 download`, data.title, artist, fullArtist, genre,
    "ZedBeatz", "Zambian music", "Zambian music download", "aweah mp3",
    `${artist} songs`, `${data.title} mp3`, `${artist} ${data.title} mp3`,
    `download ${data.title}`, "Zambia music 2026",
  ];
  
  if (typeof featuredArtists === 'string' && featuredArtists) {
    const featArtists = featuredArtists.split(/[,&]/).map((a: string) => a.trim());
    keywords.push(...featArtists);
    featArtists.forEach(fa => keywords.push(`${artist} ft ${fa}`, `${artist} ft ${fa} mp3 download`));
  }
  
  return {
    title: `${data.title} — ${fullArtist}`,
    description: `Stream and download ${data.title} by ${fullArtist} on ZedBeatz. ${genre} music from Zambia. Listen now or download MP3 free!`,
    keywords: keywords.join(", "),
    authors: [{ name: artist }], creator: artist, publisher: "ZedBeatz",
    openGraph: {
      title: `${data.title} — ${fullArtist}`,
      description: `Listen to ${data.title} by ${fullArtist} on ZedBeatz`,
      url: trackUrl, siteName: "ZedBeatz",
      images: coverUrl ? [{ url: coverUrl, secureUrl: coverUrl, width: 1200, height: 1200, alt: `${data.title} by ${fullArtist}`, type: "image/jpeg" }] : [],
      locale: "en_ZM", type: "music.song",
    },
    twitter: {
      card: "summary_large_image", title: `${data.title} — ${fullArtist}`,
      description: `Listen to ${data.title} by ${fullArtist} on ZedBeatz`,
      images: coverUrl ? [coverUrl] : [], creator: "@ZedBeatz",
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
    alternates: { canonical: trackUrl },
  };
}

export async function generateStaticParams() {
  const { data: topTracks } = await supabase
    .from("tracks")
    .select("slug, id")
    .order("plays", { ascending: false })
    .limit(50);

  if (!topTracks) return [];

  return topTracks.map((track) => ({
    id: track.slug || track.id.toString(),
  }));
}

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTrackData(id);
  if (!result) notFound();
  const { data, artistTracks } = result;

  const artist = (data.artists as unknown as { name: string } | null)?.name ?? "Unknown";
  const artistSlug = (data.artists as unknown as { slug: string } | null)?.slug;
  const rawFeat = data.featured_artists;
  const featuredArtists = typeof rawFeat === 'string' && rawFeat && rawFeat !== 'false' && rawFeat !== 'null' ? rawFeat : '';
  const fullArtist = featuredArtists ? `${artist} feat. ${featuredArtists}` : artist;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.vercel.app";
  const trackUrl = `${baseUrl}/track/${data.slug || data.id}`;
  const coverUrl = data.cover_key ? getPublicUrl(data.cover_key) : undefined;

  const moreFromArtist = (artistTracks ?? []).map(r => ({
    id: r.id,
    title: r.title,
    artist: (r.artists as any)?.name ?? "Unknown",
    artistSlug: (r.artists as any)?.slug ?? null,
    coverUrl: r.cover_key ? getPublicUrl(r.cover_key) : undefined,
    audioUrl: getPublicUrl(r.audio_key),
    duration: r.duration ?? undefined,
    slug: r.slug ?? undefined,
  }));

  const track = {
    id: data.id, title: data.title, artistId: data.artist_id ?? undefined,
    artist: artist,
    artistSlug: artistSlug,
    featuredArtists: featuredArtists,
    audioUrl: getPublicUrl(data.audio_key),
    coverUrl: coverUrl,
    duration: data.duration || undefined,
    genre: data.genre, plays: data.plays, slug: data.slug ?? undefined,
    moreFromArtist,
  };

  // JSON-LD structured data for SEO
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      "name": data.title,
      "byArtist": {
        "@type": "MusicGroup",
        "name": artist,
        "url": artistSlug ? `${baseUrl}/artist/${artistSlug}` : undefined,
      },
      "duration": data.duration ? `PT${data.duration}S` : undefined,
      "genre": data.genre || "Music",
      "image": coverUrl,
      "url": trackUrl,
      "inLanguage": "en-ZM",
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ListenAction",
        "userInteractionCount": data.plays || 0,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": artist,
          "item": artistSlug ? `${baseUrl}/artist/${artistSlug}` : `${baseUrl}/search?q=${encodeURIComponent(artist)}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": data.title,
          "item": trackUrl
        }
      ]
    }
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
