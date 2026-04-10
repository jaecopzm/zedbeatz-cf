"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Disc } from "lucide-react";
import Link from "next/link";

type Artist = { id: number; name: string };
type Album = { id: number; title: string; release_year: number | null; artist_id: number | null; artist: string };

export default function AlbumManager({ artists, albums: initial }: { artists: Artist[]; albums: Album[] }) {
  const router = useRouter();
  const [albums, setAlbums] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", artist_id: "", release_year: "" });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadCover(file: File) {
    const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType: file.type }) });
    const { url, key } = await res.json();
    await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    return key;
  }

  async function create() {
    if (!form.title || !form.artist_id) return;
    setLoading(true);
    let cover_key = null;
    if (coverFile) cover_key = await uploadCover(coverFile);
    const res = await fetch("/api/admin/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, artist_id: Number(form.artist_id), release_year: form.release_year ? Number(form.release_year) : null, cover_key }),
    });
    const album = await res.json();
    setAlbums((a) => [{ ...album, artist: artists.find((x) => x.id === album.artist_id)?.name ?? "Unknown" }, ...a]);
    setForm({ title: "", artist_id: "", release_year: "" });
    setCoverFile(null);
    setAdding(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setAdding(!adding)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:scale-105 active:scale-100 text-black font-semibold text-sm rounded-md transition-all"
      >
        <Disc size={18} /> {adding ? "Cancel" : "Add New Album"}
      </button>

      {adding && (
        <div className="border border-[var(--border)] rounded-lg p-5 bg-[var(--surface)]">
          <h3 className="text-sm font-semibold mb-4">New Album</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Album Title *</label>
              <input 
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-colors" 
                placeholder="Album title" 
                value={form.title} 
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Artist *</label>
                <select 
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-colors" 
                  value={form.artist_id} 
                  onChange={(e) => setForm((f) => ({ ...f, artist_id: e.target.value }))}
                >
                  <option value="">Select artist</option>
                  {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Release Year</label>
                <input 
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-colors" 
                  placeholder="2024" 
                  type="number"
                  value={form.release_year} 
                  onChange={(e) => setForm((f) => ({ ...f, release_year: e.target.value }))} 
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Album Cover</label>
              <input 
                type="file" 
                accept="image/*" 
                key={coverFile?.name || 'new-album'}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-[var(--surface-2)] file:text-white hover:file:bg-[var(--surface-hover)]" 
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} 
              />
            </div>
            <button 
              onClick={create} 
              disabled={loading || !form.title || !form.artist_id}
              className="w-full py-2.5 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Album"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {albums.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">No albums yet.</p>
        ) : (
          albums.map((a) => (
            <div key={a.id} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {a.artist} {a.release_year && `• ${a.release_year}`}
                  </p>
                </div>
                <Link href={`/album/${a.id}`} className="text-sm text-[var(--muted)] hover:text-white transition-colors">
                  View →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
