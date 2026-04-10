import { Music, Search as SearchIcon, ListMusic, Disc } from "lucide-react";
import Link from "next/link";

export function EmptyTracks() {
  return (
    <div className="text-center py-16">
      <Music size={64} className="mx-auto text-[var(--muted)] mb-4" />
      <h3 className="text-xl font-semibold mb-2">No tracks yet</h3>
      <p className="text-[var(--muted)] mb-6">Start building your music library</p>
      <Link href="/admin/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-md hover:scale-105 transition-all">
        <Music size={18} />
        Upload Track
      </Link>
    </div>
  );
}

export function EmptySearch() {
  return (
    <div className="text-center py-16">
      <SearchIcon size={64} className="mx-auto text-[var(--muted)] mb-4" />
      <h3 className="text-xl font-semibold mb-2">No results found</h3>
      <p className="text-[var(--muted)]">Try searching for something else</p>
    </div>
  );
}

export function EmptyPlaylists() {
  return (
    <div className="text-center py-16">
      <ListMusic size={64} className="mx-auto text-[var(--muted)] mb-4" />
      <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
      <p className="text-[var(--muted)] mb-6">Create your first playlist to organize your music</p>
    </div>
  );
}

export function EmptyAlbums() {
  return (
    <div className="text-center py-16">
      <Disc size={64} className="mx-auto text-[var(--muted)] mb-4" />
      <h3 className="text-xl font-semibold mb-2">No albums yet</h3>
      <p className="text-[var(--muted)]">Albums will appear here once created</p>
    </div>
  );
}
