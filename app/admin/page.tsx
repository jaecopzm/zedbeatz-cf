export const dynamic = "force-dynamic";

import { supabase } from "@/lib/db";
import AdminTrackList from "./track-list";

export default async function AdminPage() {
  const { data } = await supabase
    .from("tracks")
    .select("id, title, genre, plays, featured_artists, created_at, artist_id, artists(name)")
    .order("created_at", { ascending: false })
    .limit(100); // Add limit to prevent loading all tracks

  const tracks = (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    artist: (r.artists as unknown as { name: string } | null)?.name ?? "Unknown",
    artist_id: r.artist_id,
    genre: r.genre,
    featured_artists: r.featured_artists,
    plays: r.plays,
  }));

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Tracks</h1>
          <p className="text-[var(--muted)] text-xs mt-0.5">{tracks.length} recent tracks</p>
        </div>
      </div>
      <AdminTrackList tracks={tracks} />
    </div>
  );
}
