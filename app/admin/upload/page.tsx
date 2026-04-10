"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Music, Image as ImageIcon, Plus, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Artist = { id: number; name: string };
type Album = { id: number; title: string };

export default function UploadPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [newArtist, setNewArtist] = useState("");
  const [form, setForm] = useState({ title: "", artistId: "", albumId: "", genre: "", featured: false });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/artists").then((r) => r.json()).then((d) => setArtists(Array.isArray(d) ? d : []));
    fetch("/api/admin/albums").then((r) => r.json()).then((d) => setAlbums(Array.isArray(d) ? d : []));
  }, []);

  async function uploadFile(file: File, onProgress: (pct: number) => void) {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    const { url, key } = await res.json();
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    });
    return key;
  }

  async function handleAddArtist() {
    if (!newArtist.trim()) return;
    const res = await fetch("/api/admin/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newArtist.trim() }),
    });
    const artist = await res.json();
    setArtists((a) => [...a, artist]);
    setForm((f) => ({ ...f, artistId: String(artist.id) }));
    setNewArtist("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audioFile || !form.artistId) return;
    setLoading(true);
    setStatus("Uploading audio...");
    try {
      const audioKey = await uploadFile(audioFile, (pct) => { setStatus("Uploading audio..."); setProgress(pct); });
      let coverKey: string | undefined;
      if (coverFile) {
        setProgress(0);
        setStatus("Uploading cover...");
        coverKey = await uploadFile(coverFile, (pct) => { setStatus("Uploading cover..."); setProgress(pct); });
      }
      setProgress(100);
      setStatus("Saving track...");
      await fetch("/api/admin/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          artist_id: Number(form.artistId),
          album_id: form.albumId ? Number(form.albumId) : null,
          genre: form.genre || null,
          featured: form.featured,
          audio_key: audioKey,
          cover_key: coverKey ?? null,
        }),
      });
      setStatus("✅ Track uploaded successfully!");
      setTimeout(() => setStatus(""), 3000);
      setProgress(0);
      setForm({ title: "", artistId: "", albumId: "", genre: "", featured: false });
      setAudioFile(null);
      setCoverFile(null);
      router.refresh();
    } catch {
      setStatus("❌ Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-500 flex items-center justify-center shadow-[var(--glow-primary)]">
            <Upload size={20} className="text-black" />
          </div>
          Upload Track
        </h1>
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-2">Add New Music to Catalog</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 border-white/10 space-y-5 md:space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-5 md:space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Track Title *</label>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[var(--primary)] transition-all placeholder:text-white/20" 
              value={form.title} 
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} 
              placeholder="Enter track title"
              required 
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Artist *</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[var(--primary)] transition-all" 
              value={form.artistId} 
              onChange={(e) => setForm((f) => ({ ...f, artistId: e.target.value }))} 
              required
            >
              <option value="">Select an artist...</option>
              {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div className="flex gap-2 mt-3">
              <input 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-[var(--primary)] transition-all placeholder:text-white/20" 
                placeholder="Or add new artist" 
                value={newArtist} 
                onChange={(e) => setNewArtist(e.target.value)} 
              />
              <button 
                type="button" 
                onClick={handleAddArtist} 
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Album</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[var(--primary)] transition-all" 
                value={form.albumId} 
                onChange={(e) => setForm((f) => ({ ...f, albumId: e.target.value }))}
              >
                <option value="">No album</option>
                {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Genre</label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[var(--primary)] transition-all placeholder:text-white/20" 
                value={form.genre} 
                onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} 
                placeholder="e.g. Afrobeats" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 flex items-center gap-2">
                <Music size={14} /> Audio File *
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="audio/*" 
                  key={audioFile?.name || 'audio'}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} 
                  required 
                />
                <div className="w-full h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 bg-white/[0.02] group-hover:bg-white/5 transition-all">
                  {audioFile ? (
                    <>
                      <Music size={20} className="text-[var(--primary)]" />
                      <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest px-2 text-center truncate max-w-full">{audioFile.name}</p>
                    </>
                  ) : (
                    <>
                      <Music size={24} className="text-white/20" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Drop Audio</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 flex items-center gap-2">
                <ImageIcon size={14} /> Cover Image
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  key={coverFile?.name || 'cover'}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} 
                />
                <div className="w-full h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 bg-white/[0.02] group-hover:bg-white/5 transition-all">
                  {coverFile ? (
                    <>
                      <ImageIcon size={20} className="text-[var(--primary)]" />
                      <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest px-2 text-center truncate max-w-full">{coverFile.name}</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-white/20" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Drop Cover</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <input 
              type="checkbox" 
              id="featured" 
              checked={form.featured} 
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} 
              className="w-4 h-4 accent-[var(--primary)]"
            />
            <label htmlFor="featured" className="text-xs font-bold flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--primary)]" />
              Mark as featured track
            </label>
          </div>

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 p-4 bg-black/40 rounded-xl border border-[var(--primary)]/20 overflow-hidden"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-white/60 font-medium">{status}</span>
                  <span className="font-black text-[var(--primary)]">{progress}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-purple-500 rounded-full shadow-[var(--glow-primary)]" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 rounded-xl bg-[var(--primary)] hover:scale-[1.02] active:scale-[0.98] text-black font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-3 shadow-[var(--glow-primary)]"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Upload size={18} />
                </motion.div>
                Processing...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload to Catalog
              </>
            )}
          </button>

          {!loading && status && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm text-center font-bold ${status.includes("✅") ? "text-[var(--primary)]" : "text-red-500"}`}
            >
              {status}
            </motion.p>
          )}
        </div>
      </form>
    </div>
  );
}
