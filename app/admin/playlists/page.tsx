"use client";

import { useState, useEffect } from "react";
import { Plus, ListMusic, Trash2, Edit2, Save, X } from "lucide-react";
import Link from "next/link";

type Playlist = {
  id: number;
  name: string;
  cover_key?: string;
  is_featured?: boolean;
  category?: string;
  created_at: string;
  playlist_tracks?: { count: number }[];
};

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");

  useEffect(() => {
    fetchPlaylists();
  }, []);

  async function fetchPlaylists() {
    setLoading(true);
    try {
      const res = await fetch("/api/playlists?type=admin");
      const data = await res.json();
      setPlaylists(data);
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createPlaylist() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newName, 
          is_admin: true,
          category: newCategory.trim() || null,
          is_featured: true
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewCategory("");
        await fetchPlaylists();
      }
    } catch (err) {
      console.error("Failed to create playlist:", err);
    } finally {
      setCreating(false);
    }
  }

  async function deletePlaylist(id: number) {
    if (!confirm("Delete this playlist?")) return;
    try {
      await fetch("/api/playlists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchPlaylists();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  async function updatePlaylist(id: number) {
    if (!editName.trim()) return;
    try {
      await fetch("/api/playlists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          name: editName,
          category: editCategory.trim() || null
        }),
      });
      setEditingId(null);
      await fetchPlaylists();
    } catch (err) {
      console.error("Failed to update:", err);
    }
  }

  function startEdit(playlist: Playlist) {
    setEditingId(playlist.id);
    setEditName(playlist.name);
    setEditCategory(playlist.category || "");
  }

  async function toggleFeatured(id: number, currentValue: boolean) {
    try {
      await fetch("/api/playlists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_featured: !currentValue }),
      });
      await fetchPlaylists();
    } catch (err) {
      console.error("Failed to toggle featured:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Playlists</h1>
          <p className="text-[var(--muted)]">Manage curated playlists</p>
        </div>
      </div>

      {/* Create New */}
      <div className="bg-[var(--surface)] rounded-lg p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus size={18} /> Create Admin Playlist
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Playlist name (e.g., Today's Top 50)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          />
          <input
            type="text"
            placeholder="Category (e.g., Radio, Trending, Mood)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          />
          <button
            onClick={createPlaylist}
            disabled={creating || !newName.trim()}
            className="w-full px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-semibold text-sm rounded-md disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Create Admin Playlist"}
          </button>
        </div>
      </div>

      {/* Playlists List */}
      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Loading...</div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          <ListMusic size={48} className="mx-auto mb-4 opacity-50" />
          <p>No playlists yet. Create one above!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-[var(--surface)] rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--primary-dim)] flex items-center justify-center shrink-0">
                <ListMusic size={20} className="text-[var(--primary)]" />
              </div>
              
              {editingId === playlist.id ? (
                <div className="flex-1 space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && updatePlaylist(playlist.id)}
                    placeholder="Playlist name"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                    autoFocus
                  />
                  <input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && updatePlaylist(playlist.id)}
                    placeholder="Category (optional)"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    {playlist.is_featured && (
                      <button
                        onClick={() => toggleFeatured(playlist.id, playlist.is_featured!)}
                        className="px-1.5 py-0.5 bg-[var(--primary-dim)] text-[var(--primary)] text-[10px] font-bold uppercase rounded-md tracking-wider hover:bg-[var(--primary)] hover:text-black transition-colors"
                      >
                        Featured
                      </button>
                    )}
                    {!playlist.is_featured && (
                      <button
                        onClick={() => toggleFeatured(playlist.id, false)}
                        className="px-1.5 py-0.5 bg-[var(--surface-2)] text-[var(--muted)] text-[10px] font-bold uppercase rounded-md tracking-wider hover:bg-[var(--primary-dim)] hover:text-[var(--primary)] transition-colors"
                      >
                        Hidden
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                    <span>{playlist.playlist_tracks?.[0]?.count || 0} tracks</span>
                    {playlist.category && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                        {playlist.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                      Admin Playlist
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {editingId === playlist.id ? (
                  <>
                    <button
                      onClick={() => updatePlaylist(playlist.id)}
                      className="p-2 hover:bg-[var(--surface-2)] rounded-md transition-colors text-[var(--primary)]"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 hover:bg-[var(--surface-2)] rounded-md transition-colors text-[var(--muted)]"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/admin/playlists/${playlist.id}`}
                      className="p-2 hover:bg-[var(--surface-2)] rounded-md transition-colors text-[var(--muted)] hover:text-white"
                      title="Manage Tracks"
                    >
                      <Plus size={18} />
                    </Link>
                    <button
                      onClick={() => startEdit(playlist)}
                      className="p-2 hover:bg-[var(--surface-2)] rounded-md transition-colors text-[var(--muted)] hover:text-white"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deletePlaylist(playlist.id)}
                      className="p-2 hover:bg-red-500/10 rounded-md transition-colors text-[var(--muted)] hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
