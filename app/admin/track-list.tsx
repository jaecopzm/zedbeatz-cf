"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { motion } from "framer-motion";

type Track = { id: number; title: string; artist: string; artist_id: number | null; genre: string | null; featured_artists: string | null; plays: number | null };

export default function AdminTrackList({ tracks }: { tracks: Track[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editData, setEditData] = useState<{ title: string; artist: string; genre: string; featured_artists: string }>({ title: "", artist: "", genre: "", featured_artists: "" });

  function toggleSelect(id: number) {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  }

  function toggleSelectAll() {
    if (selected.size === tracks.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tracks.map(t => t.id)));
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} track(s)?`)) return;
    
    setDeleting(-1);
    await Promise.all(
      Array.from(selected).map(id =>
        fetch("/api/admin/tracks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
      )
    );
    setDeleting(null);
    setSelected(new Set());
    router.refresh();
  }

  function startEdit(t: Track) {
    setEditing(t.id);
    setEditData({ title: t.title, artist: t.artist, genre: t.genre ?? "", featured_artists: t.featured_artists ?? "" });
  }

  async function saveEdit(id: number, artist_id: number | null) {
    await fetch("/api/admin/tracks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: editData.title, genre: editData.genre || null, featured_artists: editData.featured_artists || null }),
    });
    if (artist_id) {
      await fetch(`/api/admin/artists/${artist_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editData.artist }),
      });
    }
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this track?")) return;
    setDeleting(id);
    await fetch("/api/admin/tracks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setDeleting(null);
    router.refresh();
  }

  if (!tracks.length) return (
    <div className="text-center py-12 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
      <p className="text-[var(--muted)] mb-2">No tracks yet.</p>
      <a href="/admin/upload" className="text-[var(--primary)] hover:underline">Upload your first track →</a>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Top Bar with Bulk Actions */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base md:text-xl font-black tracking-tight uppercase">Master Catalog</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{tracks.length} Tracks</p>
        </div>
        
        {selected.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl"
          >
            <span className="text-[10px] font-black uppercase tracking-widest px-3 text-[var(--primary)]">{selected.size} selected</span>
            <button 
              onClick={bulkDelete}
              disabled={deleting === -1}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button 
              onClick={() => setSelected(new Set())}
              className="p-2 text-white/20 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block glass-card rounded-[2rem] border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/[0.02] border-b border-white/5">
            <tr>
              <th className="px-6 py-5">
                <input 
                  type="checkbox" 
                  checked={selected.size === tracks.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-[var(--primary)] bg-transparent border-white/10 rounded"
                />
              </th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Release Title</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Artist</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Genre</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Reach</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Settings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tracks.map((t) => (
              <tr key={t.id} className={`group hover:bg-white/[0.02] transition-colors ${selected.has(t.id) ? "bg-[var(--primary)]/[0.02]" : ""}`}>
                {editing === t.id ? (
                  <td colSpan={6} className="px-6 py-4">
                    <div className="flex items-center gap-4 py-2">
                       <input 
                         className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[var(--primary)]" 
                         value={editData.title} 
                         onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))} 
                       />
                       <input 
                         className="w-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[var(--primary)]" 
                         value={editData.artist} 
                         onChange={(e) => setEditData((d) => ({ ...d, artist: e.target.value }))} 
                         placeholder="Artist"
                       />
                       <input 
                         className="w-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[var(--primary)]" 
                         value={editData.genre} 
                         onChange={(e) => setEditData((d) => ({ ...d, genre: e.target.value }))} 
                         placeholder="Genre"
                       />
                       <input 
                         className="w-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[var(--primary)]" 
                         value={editData.featured_artists} 
                         onChange={(e) => setEditData((d) => ({ ...d, featured_artists: e.target.value }))} 
                         placeholder="Featured artist"
                       />
                       <div className="flex gap-2 ml-auto">
                         <button onClick={() => saveEdit(t.id, t.artist_id)} className="w-10 h-10 flex items-center justify-center bg-[var(--primary)] text-black rounded-xl hover:scale-105 transition-all">
                           <Check size={18} />
                         </button>
                         <button onClick={() => setEditing(null)} className="w-10 h-10 flex items-center justify-center bg-white/5 text-white/40 rounded-xl hover:text-white transition-all">
                           <X size={18} />
                         </button>
                       </div>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-6 py-5">
                      <input 
                        type="checkbox" 
                        checked={selected.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        className="w-4 h-4 accent-[var(--primary)] bg-transparent border-white/10 rounded"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-white group-hover:text-[var(--primary)] transition-colors">{t.title}</p>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-white/40">{t.artist}</td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/5 text-white/40">
                         {t.genre ?? "Global"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-black tabular-nums text-white/60">{(t.plays ?? 0).toLocaleString()}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(t)} className="p-2 text-white/40 hover:text-white transition-colors">
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)} 
                          disabled={deleting === t.id} 
                          className="p-2 text-white/20 hover:text-red-500 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-2">
        {tracks.map((t) => (
          <div key={t.id} className={`glass-card px-3 py-2.5 rounded-xl border-white/5 relative group transition-all ${selected.has(t.id) ? "bg-[var(--primary)]/[0.05] border-[var(--primary)]/20" : ""}`}>
            {editing === t.id ? (
              <div className="space-y-2">
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none focus:border-[var(--primary)]" 
                  value={editData.title} 
                  onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))} 
                />
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none focus:border-[var(--primary)]" 
                  value={editData.artist} 
                  onChange={(e) => setEditData((d) => ({ ...d, artist: e.target.value }))} 
                  placeholder="Artist"
                />
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none focus:border-[var(--primary)]" 
                  value={editData.genre} 
                  onChange={(e) => setEditData((d) => ({ ...d, genre: e.target.value }))} 
                  placeholder="Genre"
                />
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none focus:border-[var(--primary)]" 
                  value={editData.featured_artists} 
                  onChange={(e) => setEditData((d) => ({ ...d, featured_artists: e.target.value }))} 
                  placeholder="Featured artist"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(t.id, t.artist_id)} className="flex-1 py-2 bg-[var(--primary)] text-black rounded-lg font-black text-xs uppercase tracking-widest">
                    Save
                  </button>
                  <button onClick={() => setEditing(null)} className="flex-1 py-2 bg-white/5 text-white/40 rounded-lg font-black text-xs uppercase tracking-widest">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={selected.has(t.id)}
                  onChange={() => toggleSelect(t.id)}
                  className="w-4 h-4 accent-[var(--primary)] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate leading-tight">{t.title}</p>
                  <p className="text-[10px] text-white/30 truncate">{t.artist} {t.genre ? `· ${t.genre}` : ""} · {t.plays?.toLocaleString() ?? 0} plays</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(t)} className="p-2 rounded-lg bg-white/5 text-white/40 active:text-white">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id} className="p-2 rounded-lg bg-white/5 text-white/20 active:text-red-500 disabled:opacity-40">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
