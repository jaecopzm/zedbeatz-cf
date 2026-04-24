import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";
import { Disc3, Music2 } from "lucide-react";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: album }, { data: rawTracks }] = await unstable_cache(
    async () => Promise.all([
      supabase.from("albums").select("id, title, cover_key, release_year, artist_id, artists(name, slug)").eq("id", Number(id)).single(),
      supabase.from("tracks").select("id, title, audio_key, cover_key, duration, artist_id, slug, featured_artists, artists(name, slug)").eq("album_id", Number(id)).order("created_at"),
    ]),
    [`album-${id}`],
    { revalidate: 600 }
  )();

  if (!album) notFound();

  const artistName = (album.artists as { name: string; slug?: string } | null)?.name ?? "Unknown";
  const artistSlug = (album.artists as { name: string; slug?: string } | null)?.slug;
  const tracks: Track[] = (rawTracks ?? []).map((t) => ({
    id: t.id, title: t.title, artistId: t.artist_id ?? undefined,
    artist: (t.artists as { name: string } | null)?.name ?? artistName,
    artistSlug: (t.artists as { slug: string } | null)?.slug,
    featuredArtists: sanitizeFeaturedArtists(t.featured_artists),
    audioUrl: getPublicUrl(t.audio_key),
    coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : undefined,
    duration: t.duration ?? undefined,
    slug: t.slug ?? undefined,
  }));

  const coverUrl = album.cover_key ? getPublicUrl(album.cover_key) : null;

  return (
    <div className="pb-28">
      {/* Hero header */}
      <div className="relative overflow-hidden mb-8">
        {/* Blurred background */}
        {coverUrl && (
          <div className="absolute inset-0 -z-10">
            <Image src={coverUrl} alt="" fill className="object-cover scale-110 blur-2xl opacity-20" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background)]/60 to-[var(--background)]" />
          </div>
        )}

        <div className="px-4 md:px-8 pt-8 pb-6 flex flex-col sm:flex-row items-start sm:items-end gap-5">
          {/* Cover */}
          <div className="w-36 h-36 md:w-48 md:h-48 rounded-2xl overflow-hidden bg-[var(--surface-2)] shrink-0 shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
            {coverUrl
              ? <Image src={coverUrl} alt={album.title} width={192} height={192} className="object-cover w-full h-full" unoptimized />
              : <div className="w-full h-full flex items-center justify-center"><Disc3 size={40} className="text-[var(--muted)]/30" /></div>
            }
          </div>

          {/* Info */}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
              Album{album.release_year ? ` · ${album.release_year}` : ""}
            </p>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight mb-2">{album.title}</h1>
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              {artistSlug
                ? <Link href={`/artist/${artistSlug}`} className="hover:text-white transition-colors font-semibold">{artistName}</Link>
                : <span className="font-semibold">{artistName}</span>
              }
              <span>·</span>
              <span>{tracks.length} track{tracks.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="px-4 md:px-8">
        {tracks.length > 0 ? (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[var(--primary)] to-emerald-400 shrink-0" />
              <h2 className="text-lg font-bold">Tracks</h2>
              <span className="px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[11px] font-semibold text-[var(--muted)]">{tracks.length}</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3">
              {tracks.map((t) => <TrackCard key={t.id} track={t} queue={tracks} bare />)}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--muted)]">
            <Music2 size={40} className="mb-3 opacity-30" />
            <p>No tracks in this album yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
