import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import TrackCard from "@/components/track-card";
import type { Track } from "@/lib/player-store";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: album }, { data: rawTracks }] = await unstable_cache(
    async () => Promise.all([
      supabase.from("albums").select("id, title, cover_key, release_year, artist_id, artists(name)").eq("id", Number(id)).single(),
      supabase.from("tracks").select("id, title, audio_key, cover_key, duration, artist_id, artists(name)").eq("album_id", Number(id)).order("created_at"),
    ]),
    [`album-${id}`],
    { revalidate: 600 }
  )();

  if (!album) notFound();

  const artistName = (album.artists as { name: string } | null)?.name ?? "Unknown";
  const tracks: Track[] = (rawTracks ?? []).map((t) => ({
    id: t.id, title: t.title, artistId: t.artist_id ?? undefined,
    artist: (t.artists as { name: string } | null)?.name ?? artistName,
    audioUrl: getPublicUrl(t.audio_key),
    coverUrl: t.cover_key ? getPublicUrl(t.cover_key) : undefined,
    duration: t.duration ?? undefined,
  }));

  const coverUrl = album.cover_key ? getPublicUrl(album.cover_key) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-end gap-6">
        <div className="w-40 h-40 rounded-xl overflow-hidden bg-[var(--surface-2)] shrink-0">
          {coverUrl ? <Image src={coverUrl} alt={album.title} width={160} height={160} className="object-cover w-full h-full" /> : <div className="w-full h-full" />}
        </div>
        <div>
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">Album{album.release_year ? ` · ${album.release_year}` : ""}</p>
          <h1 className="text-3xl font-bold">{album.title}</h1>
          <p className="text-[var(--muted)] text-sm mt-1">{artistName} · {tracks.length} tracks</p>
        </div>
      </div>
      {tracks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tracks.map((t) => <TrackCard key={t.id} track={t} queue={tracks} />)}
        </div>
      )}
    </div>
  );
}
