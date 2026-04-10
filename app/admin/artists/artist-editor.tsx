"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Check, X, Plus, UserPlus, Trash2, Camera, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Artist = { id: number; name: string; bio: string | null; image_key: string | null; imageUrl: string | null };

export default function ArtistEditor({ artists }: { artists: Artist[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", bio: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);

  function startEdit(a: Artist) {
    setEditing(a.id);
    setAdding(false);
    setForm({ name: a.name, bio: a.bio ?? "" });
    setImageFile(null);
  }

  function startAdd() {
    setAdding(true);
    setEditing(null);
    setForm({ name: "", bio: "" });
    setImageFile(null);
  }

  async function save(a?: Artist) {
    let image_key = a?.image_key ?? null;
    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append("file", imageFile);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const { key } = await res.json();
        image_key = key;
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Failed to upload image");
        return;
      }
    }
    
    try {
      if (adding) {
        await fetch("/api/admin/artists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, bio: form.bio || null, image_key }) });
        setAdding(false);
      } else if (a) {
        await fetch(`/api/admin/artists/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, bio: form.bio || null, image_key }) });
        setEditing(null);
      }
      setImageFile(null);
      router.refresh();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save artist");
    }
  }

  async function deleteArtist(id: number) {
    if (!confirm("Delete this artist? This will also remove them from all tracks.")) return;
    setDeleting(id);
    await fetch(`/api/admin/artists/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">Artist Roster</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{artists.length} Verified Creators</p>
        </div>
        
        <button 
          onClick={startAdd}
          className="flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          <UserPlus size={18} /> Add New Creator
        </button>
      </div>

      {/* Add New Artist Form */}
      <AnimatePresence>
        {adding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6 md:mb-8"
          >
            <div className="glass-card rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 border-white/10 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent pointer-events-none" />
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-[var(--primary)]">Initialization Sequence</h3>
                    <button onClick={() => setAdding(false)} className="text-white/20 hover:text-white"><X size={20} /></button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                   <div className="space-y-4 md:space-y-6">
                     <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Stage Name</label>
                       <input 
                         className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm font-bold text-white outline-none focus:border-[var(--primary)] transition-all" 
                         value={form.name} 
                         onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                         placeholder="e.g. Yo Maps" 
                       />
                     </div>
                     <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Artist Biography</label>
                       <textarea 
                         className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm font-bold text-white outline-none focus:border-[var(--primary)] transition-all resize-none" 
                         rows={4} 
                         value={form.bio} 
                         onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} 
                         placeholder="Tell the world their story..." 
                       />
                     </div>
                   </div>
                   
                   <div className="space-y-4 md:space-y-6">
                     <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Identity Visual (Image)</label>
                       <div className="relative group cursor-pointer">
                         <input 
                           type="file" 
                           accept="image/*" 
                           key={imageFile?.name || 'new-artist'}
                           className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                           onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} 
                         />
                         <div className="w-full h-40 md:h-48 rounded-xl md:rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 bg-white/[0.02] group-hover:bg-white/5 transition-all">
                            {imageFile ? (
                              <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">{imageFile.name}</p>
                            ) : (
                              <>
                                <Camera size={32} className="text-white/20" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Drop or Click to Upload</span>
                              </>
                            )}
                         </div>
                       </div>
                     </div>
                     
                     <button 
                       onClick={() => save()} 
                       className="w-full py-4 md:py-5 bg-[var(--primary)] text-black rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[var(--glow-primary)] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                     >
                       <Check size={18} strokeWidth={3} /> Finalize Identity
                     </button>
                   </div>
                 </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {artists.map((a, i) => (
          <motion.div 
            key={a.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.5) }}
            className={`glass-card rounded-[2.5rem] border-white/5 relative overflow-hidden group transition-all duration-500 ${editing === a.id ? "ring-2 ring-[var(--primary)]/50" : "hover:bg-white/[0.02] hover:border-white/10"}`}
          >
            {editing === a.id ? (
              <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center font-black text-base md:text-lg text-[var(--primary)] relative">
                      {a.imageUrl ? <Image src={a.imageUrl} alt={a.name} width={56} height={56} className="object-cover" /> : a.name[0]}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                         <Camera size={16} className="text-white" />
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} 
                      />
                   </div>
                   <input 
                     className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-[var(--primary)]" 
                     value={form.name} 
                     onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                     placeholder="Artist name"
                   />
                </div>

                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white/60 outline-none focus:border-[var(--primary)] resize-none" 
                  rows={2} 
                  value={form.bio} 
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} 
                  placeholder="Bio (optional)"
                />

                <div className="flex gap-2 pt-2">
                  <button onClick={() => save(a)} className="flex-1 py-2.5 bg-[var(--primary)] text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[var(--glow-primary)]">
                    <Check size={14} className="inline mr-1" /> Save
                  </button>
                  <button onClick={() => setEditing(null)} className="px-4 py-2.5 bg-white/5 text-white/40 rounded-xl hover:text-white transition-all">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white/10 flex items-center justify-center font-black text-base md:text-lg text-[var(--primary)] bg-white/[0.02] shadow-xl group-hover:scale-105 transition-transform duration-500">
                        {a.imageUrl ? (
                          <Image src={a.imageUrl} alt={a.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                        ) : (
                          <User size={20} className="text-white/10 md:w-6 md:h-6" />
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-black border-2 border-[var(--surface)]">
                         <Check size={8} strokeWidth={4} />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-base md:text-lg font-black tracking-tight text-white group-hover:text-[var(--primary)] transition-colors">{a.name}</h3>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Verified</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(a)} className="p-2 rounded-lg bg-white/5 text-white/30 hover:text-white transition-all hover:bg-white/10">
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => deleteArtist(a.id)} 
                      disabled={deleting === a.id}
                      className="p-2 rounded-lg bg-white/5 text-white/10 hover:text-red-500 transition-all hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-xs font-medium text-white/40 leading-relaxed line-clamp-2 mb-3">
                  {a.bio || "No biography provided for this creator."}
                </p>
                
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/10">Catalog</span>
                   <Link 
                     href={`/artist/${(a as any).slug || a.id}`} 
                     className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline"
                   >
                     View Profile
                   </Link>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
