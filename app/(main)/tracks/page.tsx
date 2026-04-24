import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import TrackCard from "@/components/track-card";
import TracksSearch from "@/components/tracks-search";
import type { Track } from "@/lib/player-store";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TRACKS_PER_PAGE = 24;

export default async function AllTracksPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const offset = (page - 1) * TRACKS_PER_PAGE;

  const { data: rawTracks, count } = await unstable_cache(
    async () => supabase
      .from("tracks")
      .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + TRACKS_PER_PAGE - 1),
    [`tracks-page-${page}`],
    { revalidate: 120 }
  )();

  const trackList: Track[] = (rawTracks ?? []).map((r): Track => ({
    id: r.id,
    title: r.title,
    artistId: r.artist_id ?? undefined,
    artist: (r.artists as unknown as { name: string } | null)?.name ?? "Unknown",
    artistSlug: (r.artists as unknown as { slug: string } | null)?.slug,
    featuredArtists: sanitizeFeaturedArtists(r.featured_artists),
    audioUrl: getPublicUrl(r.audio_key),
    coverUrl: r.cover_key ? getPublicUrl(r.cover_key) : undefined,
    duration: r.duration ?? undefined,
    slug: r.slug ?? undefined,
  }));

  const totalPages = Math.ceil((count || 0) / TRACKS_PER_PAGE);

  return (
    <div className="space-y-6 pb-20 px-4 md:px-8">
      <div className="pt-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-1">All Tracks</h1>
        <p className="text-xs md:text-sm text-[var(--muted)] mb-3">{count || 0} tracks available</p>
        <TracksSearch tracks={trackList} />
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3">
        {trackList.map((track) => (
          <TrackCard key={track.id} track={track} queue={trackList} bare />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-6 pb-24">
          {page > 1 && (
            <Link
              href={`/tracks?page=${page - 1}`}
              className="flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors text-sm"
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:inline">Previous</span>
            </Link>
          )}
          
          <div className="flex items-center gap-1 md:gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <Link
                  key={pageNum}
                  href={`/tracks?page=${pageNum}`}
                  className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg text-sm transition-colors ${
                    page === pageNum
                      ? "bg-[var(--primary)] text-black font-semibold"
                      : "bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>

          {page < totalPages && (
            <Link
              href={`/tracks?page=${page + 1}`}
              className="flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={15} />
            </Link>
          )}
        </div>
      )}

      {trackList.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[var(--muted)] text-lg">No tracks found</p>
        </div>
      )}
    </div>
  );
}
