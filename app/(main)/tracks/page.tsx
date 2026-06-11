import type { Metadata } from "next";
import { db } from "@/lib/db/drizzle";
import { tracks, artists } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import TracksSearch from "@/components/tracks-search";
import type { Track } from "@/lib/player-store";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TracksListClient from "@/components/tracks-list-client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";

export const metadata: Metadata = {
  title: "All Zambian Music Tracks & MP3 Downloads | ZedBeatz",
  description: "Browse all Zambian music tracks on ZedBeatz. Download and stream the latest Zambian songs MP3. Chile One, Yo Maps, Kell Kay, and more.",
  keywords: ["Zambian music list", "Zambian songs download", "Zambia mp3 tracks", "ZedBeatz tracks"],
  alternates: {
    canonical: `${siteUrl}/tracks`,
  },
  openGraph: {
    title: "All Zambian Music Tracks & MP3 Downloads | ZedBeatz",
    description: "Browse, stream and download latest Zambian music MP3 on ZedBeatz.",
    url: `${siteUrl}/tracks`,
    type: "website",
  }
};

const TRACKS_PER_PAGE = 24;

export default async function AllTracksPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const offset = (page - 1) * TRACKS_PER_PAGE;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(tracks);
  const total = countResult?.count ?? 0;

  const rawTracks = await db
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
    .orderBy(desc(tracks.createdAt))
    .limit(TRACKS_PER_PAGE)
    .offset(offset);

  const trackList: Track[] = rawTracks.map((r): Track => ({
    id: r.id,
    title: r.title,
    artistId: r.artistId ?? undefined,
    artist: r.artistName ?? "Unknown",
    artistSlug: r.artistSlug ?? undefined,
    featuredArtists: sanitizeFeaturedArtists(r.featuredArtists),
    audioUrl: getPublicUrl(r.audioKey),
    coverUrl: r.coverKey ? getPublicUrl(r.coverKey) : undefined,
    duration: r.duration ? Number(r.duration) : undefined,
    slug: r.slug ?? undefined,
  }));

  const totalPages = Math.ceil(total / TRACKS_PER_PAGE);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedbeatz.com";

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Zambian Music Songs List",
    "description": "Latest Zambian music MP3 downloads and streams on ZedBeatz.",
    "numberOfItems": trackList.length,
    "itemListElement": trackList.map((track, i) => ({
      "@type": "ListItem",
      "position": i + 1 + offset,
      "item": {
        "@type": "MusicRecording",
        "name": track.title,
        "url": `${baseUrl}/track/${track.slug || track.id}`,
        "byArtist": {
          "@type": "MusicGroup",
          "name": track.artist,
        }
      }
    }))
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Tracks", "item": `${baseUrl}/tracks` }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListLd, breadcrumbLd]) }} />
      <div className="pb-20">
        {/* Header */}
        <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[var(--border)]">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-0.5">All Tracks</h1>
          <p className="text-xs text-[var(--muted)]">{total.toLocaleString()} songs</p>
        </div>

        {/* Search + suggestions */}
        <div className="px-4 md:px-8 py-4 border-b border-[var(--border)]">
          <TracksSearch tracks={trackList} />
        </div>

        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[32px_1fr_1fr_80px_48px] gap-4 px-4 md:px-8 py-2 border-b border-[var(--border)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-2)] text-center">#</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-2)]">Title</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-2)]">Artist</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-2)] text-right">Time</span>
          <span />
        </div>

        {/* Track rows */}
        <TracksListClient tracks={trackList} offset={offset} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-8 px-4">
            {page > 1 && (
              <Link href={`/tracks?page=${page - 1}`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors text-sm font-medium">
                <ChevronLeft size={15} /> Prev
              </Link>
            )}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <Link key={p} href={`/tracks?page=${p}`}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-[var(--primary)] text-black" : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"}`}>
                    {p}
                  </Link>
                );
              })}
            </div>
            {page < totalPages && (
              <Link href={`/tracks?page=${page + 1}`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors text-sm font-medium">
                Next <ChevronRight size={15} />
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
