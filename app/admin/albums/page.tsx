export const dynamic = "force-dynamic";

import { supabase } from "@/lib/db";
import AlbumManager from "./album-manager";

export default async function AdminAlbumsPage() {
  const [{ data: artists }, { data: albums }] = await Promise.all([
    supabase.from("artists").select("id, name").order("name"),
    supabase.from("albums").select("id, title, release_year, artist_id, artists(name)").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Albums</h1>
        <p className="text-[var(--muted)] text-sm mt-1">{albums?.length ?? 0} total albums</p>
      </div>
      <AlbumManager
        artists={artists ?? []}
        albums={(albums ?? []).map((a) => ({ id: a.id, title: a.title, release_year: a.release_year, artist_id: a.artist_id, artist: (a.artists as unknown as { name: string } | null)?.name ?? "Unknown" }))}
      />
    </div>
  );
}
