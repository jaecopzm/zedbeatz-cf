"use client";

import { useState, useEffect, use } from "react";
import { ListMusic, Trash2, Search, ArrowLeft, Save, Star, LayoutGrid, Check, Plus, Upload } from "lucide-react";
import Link from "next/link";
import { showToast } from "@/components/toast";

type Track = {
  id: number;
  title: string;
  artist: string;
  coverUrl?: string;
};

type Playlist = {
  id: number;
  name: string;
  is_featured: boolean;
  category: string;
  cover_key?: string;
};

export default function PlaylistEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: playlistId } = use(params);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [currentTracks, setCurrentTracks] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/playlists`).then(r => r.json()),
      fetch(`/api/playlists/${playlistId}`).then(r => r.json()),
      fetch(`/api/tracks`).then(r => r.json())
    ]).then(([playlists, tracks, all]) => {
      const p = playlists.find((x: any) => x.id === Number(playlistId));
      setPlaylist(p || null);
      setCurrentTracks(tracks || []);
      setAllTracks(all || []);
      setLoading(false);
    });
  }, [playlistId]);

  async function uploadCover(file: File) {
    setCoverUploading(true);
    try {
      const { url, key } = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      }).then(r => r.json());
      await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      await updateMetadata({ cover_key: key });
      showToast("Cover updated", "success");
    } catch {
      showToast("Failed to upload cover", "error");
    } finally {
      setCoverUploading(false);
    }
  }

  async function updateMetadata(updates: Partial<Playlist>) {    if (!playlist) return;
    const newPlaylist = { ...playlist, ...updates };
    setPlaylist(newPlaylist);
    
    try {
      await fetch(`/api/playlists`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: playlist.id, ...updates })
      });
      showToast("Playlist updated", "success");
    } catch (err) {
      showToast("Failed to update playlist", "error");
    }
  }

  async function addTrack(trackId: number) {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId })
      });
      if (res.ok) {
        const track = allTracks.find(t => t.id === trackId);
        if (track) setCurrentTracks([...currentTracks, track]);
        showToast("Track added", "success");
      }
    } catch (err) {
      showToast("Failed to add track", "error");
    }
  }

  async function removeTrack(trackId: number) {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId })
      });
      if (res.ok) {
        setCurrentTracks(currentTracks.filter(t => t.id !== trackId));
        showToast("Track removed", "success");
      }
    } catch (err) {
      showToast("Failed to remove track", "error");
    }
  }

  const filteredSearch = allTracks.filter(t => 
    (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.artist.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !currentTracks.some(ct => ct.id === t.id)
  ).slice(0, 20);

  if (loading) return <div className="p-10 text-center text-[var(--muted)]">Loading...</div>;
  if (!playlist) return <div className="p-10 text-center">Playlist not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link href="/admin/playlists" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white transition-colors w-fit">
          <ArrowLeft size={16} /> Back to playlists
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <label className="w-24 h-24 rounded-2xl bg-[var(--primary-dim)] flex items-center justify-center shrink-0 border border-[var(--primary)]/20 shadow-lg cursor-pointer overflow-hidden relative group hover:opacity-80 transition-opacity">
              {playlist.cover_key ? (
                <img src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${playlist.cover_key}`} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <ListMusic size={40} className="text-[var(--primary)]" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {coverUploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={20} className="text-white" />}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadCover(e.target.files[0])} />
            </label>
            <div>
              <input 
                type="text" 
                value={playlist.name}
                onChange={(e) => setPlaylist({ ...playlist, name: e.target.value })}
                onBlur={() => updateMetadata({ name: playlist.name })}
                className="text-4xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 mb-1 w-full"
              />
              <p className="text-[var(--muted)]">{currentTracks.length} tracks in this playlist</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => updateMetadata({ is_featured: !playlist.is_featured })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                playlist.is_featured 
                ? "bg-[var(--primary-dim)] border-[var(--primary)]/30 text-[var(--primary)]" 
                : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-white"
              }`}
             >
              <Star size={18} fill={playlist.is_featured ? "currentColor" : "none"} />
              {playlist.is_featured ? "Featured" : "Mark Featured"}
             </button>
             <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)]">
                  <LayoutGrid size={16} />
                </div>
                <select 
                  value={playlist.category || ""}
                  onChange={(e) => updateMetadata({ category: e.target.value })}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] appearance-none cursor-pointer hover:bg-[var(--surface-2)] transition-colors min-w-40"
                >
                  <option value="">No Category</option>
                  <option value="Top Charts">Top Charts</option>
                  <option value="New Releases">New Releases</option>
                  <option value="Artist Hits">Artist Hits</option>
                  <option value="Today's Trending">Today's Trending</option>
                  <option value="Moods">Moods</option>
                </select>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Track List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Tracks</h2>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
            {currentTracks.length === 0 ? (
              <div className="p-12 text-center text-[var(--muted)]">
                <ListMusic size={40} className="mx-auto mb-3 opacity-20" />
                <p>No tracks added yet. Use the search to add tracks.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {currentTracks.map((track, i) => (
                  <div key={track.id} className="flex items-center gap-4 p-4 hover:bg-[var(--surface-2)] transition-colors group">
                    <span className="w-4 text-xs text-[var(--muted)] text-center">{i + 1}</span>
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-[var(--surface-3)] shrink-0">
                      {track.coverUrl && <img src={track.coverUrl} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{track.title}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{track.artist}</p>
                    </div>
                    <button 
                      onClick={() => removeTrack(track.id)}
                      className="p-2 text-[var(--muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Tracks Sidebar */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Add Tracks</h2>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)]">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Search tracks or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="space-y-2">
              {searchQuery.length > 0 ? (
                filteredSearch.length > 0 ? (
                  filteredSearch.map(track => (
                    <button 
                      key={track.id} 
                      onClick={() => addTrack(track.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded bg-[var(--surface-3)] overflow-hidden shrink-0">
                        {track.coverUrl && <img src={track.coverUrl} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{track.title}</p>
                        <p className="text-[10px] text-[var(--muted)] truncate">{track.artist}</p>
                      </div>
                      <Plus size={14} className="text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-[var(--muted)] p-2">No results found</p>
                )
              ) : (
                <div className="p-4 text-center">
                  <Search size={24} className="mx-auto mb-2 text-[var(--muted)] opacity-20" />
                  <p className="text-xs text-[var(--muted)]">Search for tracks to add them to this playlist</p>
                </div>
              )}
            </div>
            
            {searchQuery.length > 0 && (
              <p className="text-[10px] text-[var(--muted)] text-center">
                Showing top 5 matches
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
