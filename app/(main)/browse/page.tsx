import { unstable_cache } from "next/cache";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import type { Track } from "@/lib/player-store";
import GenreGrid from "@/components/browse/genre-grid";
import FeaturedPlaylists from "@/components/browse/featured-playlists";
import NewReleases from "@/components/browse/new-releases";
import TopCharts from "@/components/browse/top-charts";

const getBrowseData = unstable_cache(async () => {
  const [{ data: rawTracks }, { data: rawArtists }] = await Promise.all([
    supabase
      .from("tracks")
      .select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, plays, genre, artists(name, slug)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("artists").select("id, name, slug").limit(20),
  ]);

  const tracks: Track[] = (rawTracks ?? []).map((r) => ({
    id: r.id, title: r.title,
    artistId: r.artist_id ?? undefined,
    artist: (r.artists as any)?.name ?? "Unknown",
    artistSlug: (r.artists as any)?.slug,
    featuredArtists: sanitizeFeaturedArtists(r.featured_artists),
    audioUrl: getPublicUrl(r.audio_key),
    coverUrl: r.cover_key ? getPublicUrl(r.cover_key) : undefined,
    duration: r.duration ?? undefined,
    slug: r.slug ?? undefined,
  }));

  const genres = Array.from(new Set((rawTracks ?? []).map((t) => t.genre).filter(Boolean))) as string[];
  const plays: Record<number, number> = Object.fromEntries((rawTracks ?? []).map((t) => [t.id, t.plays ?? 0]));

  return { tracks, genres, plays };
}, ["browse-data"], { revalidate: 300 });

export default async function BrowsePage() {
  const { tracks, genres, plays } = await getBrowseData();
  const topTracks = [...tracks].sort((a, b) => (plays[b.id] ?? 0) - (plays[a.id] ?? 0));

  return (
    <div className="min-h-screen pb-32">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-6 md:pb-8">
        <h1 className="text-2xl md:text-5xl font-bold mb-2 md:mb-3 tracking-tight">Browse</h1>
        <p className="text-sm md:text-base text-[var(--muted)]">Discover the best of Zambian music by genre, mood, and charts.</p>
      </div>

      <section className="px-4 md:px-8 mb-10 md:mb-14 mt-4 md:mt-6">
        <h2 className="text-base md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
          <span className="w-1 h-5 md:w-1.5 md:h-6 bg-purple-500 rounded-full" />
          Browse by Genre
        </h2>
        <GenreGrid genres={genres} />
      </section>

      <section className="px-4 md:px-8 mb-10 md:mb-14">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-xl font-bold flex items-center gap-2">
            <span className="w-1 h-5 md:w-1.5 md:h-6 bg-[var(--primary)] rounded-full" />
            Curated Playlists
          </h2>
          <Link href="/library" className="group flex items-center gap-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition-all">
            See all <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform md:w-3.5 md:h-3.5" />
          </Link>
        </div>
        <FeaturedPlaylists />
      </section>

      <section className="px-4 md:px-8 mb-10 md:mb-14">
        <h2 className="text-base md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
          <span className="w-1 h-5 md:w-1.5 md:h-6 bg-yellow-500 rounded-full" />
          Top Charts
        </h2>
        <TopCharts tracks={topTracks} />
      </section>

      <section className="px-4 md:px-8 mb-10 md:mb-14">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-xl font-bold flex items-center gap-2">
            <span className="w-1 h-5 md:w-1.5 md:h-6 bg-cyan-500 rounded-full" />
            New Releases
          </h2>
          <Link href="/tracks" className="group flex items-center gap-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition-all">
            Show all <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform md:w-3.5 md:h-3.5" />
          </Link>
        </div>
        <NewReleases tracks={tracks.slice(0, 12)} />
      </section>
    </div>
  );
}
