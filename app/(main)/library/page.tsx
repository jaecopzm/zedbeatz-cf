'use client';

import { useEffect, useState } from "react";
import { Plus, Play, Music, Heart, Clock, Search, X, Edit2, Trash2, BookmarkX, ChevronLeft, MoreVertical, Shuffle } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, SignInButton } from "@clerk/nextjs";
import { ListMusic } from "lucide-react";

type Playlist = {
  id: number;
  name: string;
  cover_key?: string;
  cover_url?: string;
  category?: string;
  is_featured?: boolean;
  playlist_tracks: { count: number }[];
  isAdmin?: boolean;
  isSaved?: boolean;
};

type ViewState = "list" | "detail";

export default function LibraryPage() {
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<number | "recent" | "liked" | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [view, setView] = useState<ViewState>("list");
  const { setQueue, currentTrack } = usePlayer();
  const [searchQuery, setSearchQuery] = useState("");
  const { isSignedIn, isLoaded } = useUser();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const likedPlaylist = userPlaylists.find(p => p.name === "Favourites");
  const allPlaylists = [
    ...userPlaylists.filter(p => p.name !== "Favourites"),
    ...savedPlaylists.map(p => ({ ...p, isAdmin: true, isSaved: true })),
  ];
  const filteredUser = userPlaylists.filter(p => p.name !== "Favourites" && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSaved = savedPlaylists.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedFull = selected === "recent" || selected === "liked" ? null : [...userPlaylists, ...savedPlaylists].find(p => p.id === selected);

  const selectedName = selected === "recent" ? "Recently Played" : selected === "liked" ? "Liked Songs" : selectedFull?.name ?? "";
  const selectedCount = selected === "recent" ? recentlyPlayed.length : selected === "liked" ? (likedPlaylist?.playlist_tracks?.[0]?.count ?? 0) : (selectedFull?.playlist_tracks?.[0]?.count ?? 0);

  async function renamePlaylist(id: number) {
    if (!editName.trim()) { setEditingId(null); return; }
    await fetch("/api/playlists", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName.trim() }) });
    setUserPlaylists(prev => prev.map(p => p.id === id ? { ...p, name: editName.trim() } : p));
    setEditingId(null);
  }

  useEffect(() => {
    if (!isLoaded) return;
    loadPlaylists();
    if (isSignedIn) {
      fetch("/api/recently-played/list").then(r => r.json()).then(d => setRecentlyPlayed(d.tracks || []));
    }
  }, [isSignedIn, isLoaded]);

  // Listen for like changes
  useEffect(() => {
    async function handleLikesChanged(e: Event) {
      const detail = (e as CustomEvent).detail;
      await loadPlaylists();
      
      // If viewing liked songs, refresh tracks
      if (selected === "liked") {
        // Optimistic update - remove immediately if unliked
        if (!detail?.liked && detail?.trackId) {
          setTracks(prev => prev.filter(t => t.id !== detail.trackId));
        }
        
        // Then fetch fresh data
        const res = await fetch("/api/playlists?type=user");
        const playlists = await res.json();
        const fav = Array.isArray(playlists) ? playlists.find((p: any) => p.name === "Favourites") : null;
        if (fav?.id) {
          const tracksRes = await fetch(`/api/playlists/${fav.id}`);
          setTracks(await tracksRes.json());
        }
      }
    }
    window.addEventListener('likesChanged', handleLikesChanged);
    return () => window.removeEventListener('likesChanged', handleLikesChanged);
  }, [selected]);

  async function loadPlaylists() {
    if (isSignedIn) {
      const [user, saved] = await Promise.all([
        fetch("/api/playlists?type=user").then(r => r.json()),
        fetch("/api/playlists?type=saved").then(r => r.json()),
      ]);
      setUserPlaylists(Array.isArray(user) ? user : []);
      setSavedPlaylists(Array.isArray(saved) ? saved : []);
    } else {
      const data = await fetch("/api/playlists?type=admin").then(r => r.json());
      setSavedPlaylists(Array.isArray(data) ? data : []);
      setUserPlaylists([]);
    }
  }

  async function createPlaylist() {
    if (!newName.trim()) return;
    const res = await fetch("/api/playlists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim() }) });
    const p = await res.json();
    setUserPlaylists(prev => [p, ...prev]);
    setNewName(""); setShowCreate(false);
  }

  async function selectPlaylist(id: number | "recent" | "liked") {
    setSelected(id);
    setView("detail");
    if (id === "recent") { setTracks(recentlyPlayed); return; }
    if (id === "liked") {
      const res = await fetch("/api/playlists?type=user");
      const playlists = await res.json();
      const fav = Array.isArray(playlists) ? playlists.find((p: any) => p.name === "Favourites") : null;
      if (!fav?.id) { setTracks([]); return; }
      const tracksRes = await fetch(`/api/playlists/${fav.id}`);
      setTracks(await tracksRes.json());
      return;
    }
    const res = await fetch(`/api/playlists/${id}`);
    setTracks(await res.json());
  }

  async function removeTrack(playlistId: number, trackId: number) {
    await fetch(`/api/playlists/${playlistId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track_id: trackId }) });
    setTracks(t => t.filter(x => x.id !== trackId));
    loadPlaylists();
  }

  async function deletePlaylist(id: number) {
    await fetch(`/api/playlists/${id}`, { method: "DELETE" });
    setUserPlaylists(p => p.filter(x => x.id !== id));
    if (selected === id) { setSelected(null); setView("list"); }
  }

  async function unsavePlaylist(id: number) {
    await fetch("/api/playlists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unsave", playlist_id: id }) });
    setSavedPlaylists(p => p.filter(x => x.id !== id));
    if (selected === id) { setSelected(null); setView("list"); }
  }

  function goBack() { setView("list"); setSelected(null); }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <ListView
              isSignedIn={!!isSignedIn}
              isLoaded={isLoaded}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showCreate={showCreate}
              setShowCreate={setShowCreate}
              newName={newName}
              setNewName={setNewName}
              createPlaylist={createPlaylist}
              likedPlaylist={likedPlaylist}
              recentlyPlayed={recentlyPlayed}
              filteredUser={filteredUser}
              filteredSaved={filteredSaved}
              selected={selected}
              selectPlaylist={selectPlaylist}
              editingId={editingId}
              editName={editName}
              setEditName={setEditName}
              renamePlaylist={renamePlaylist}
              setEditingId={setEditingId}
              deletePlaylist={deletePlaylist}
              unsavePlaylist={unsavePlaylist}
            />
          </motion.div>
        ) : (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <DetailView
              selected={selected}
              selectedName={selectedName}
              selectedCount={selectedCount}
              selectedFull={selectedFull}
              tracks={tracks}
              currentTrack={currentTrack}
              isSignedIn={!!isSignedIn}
              setQueue={setQueue}
              removeTrack={removeTrack}
              goBack={goBack}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ isSignedIn, isLoaded, searchQuery, setSearchQuery, showCreate, setShowCreate, newName, setNewName, createPlaylist, likedPlaylist, recentlyPlayed, filteredUser, filteredSaved, selected, selectPlaylist, editingId, editName, setEditName, renamePlaylist, setEditingId, deletePlaylist, unsavePlaylist }: any) {
  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)] px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black tracking-tight">Library</h1>
          {isSignedIn ? (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-[var(--glow-primary)] active:scale-95 transition-transform"
            >
              <Plus size={18} className="text-black" strokeWidth={2.5} />
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="w-9 h-9 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                <Plus size={18} className="text-[var(--primary)]" />
              </button>
            </SignInButton>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search playlists..."
            className="w-full bg-[var(--surface-2)] rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]/40 transition-all placeholder:text-[var(--muted)]"
          />
        </div>
      </div>

      {/* Create playlist form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mt-3 p-4 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] mb-2">New Playlist</p>
              <input
                autoFocus
                className="w-full bg-[var(--surface-3)] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)] mb-3 placeholder:text-[var(--muted)]"
                placeholder="Playlist name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createPlaylist()}
              />
              <div className="flex gap-2">
                <button onClick={createPlaylist} className="flex-1 py-2.5 bg-[var(--primary)] text-black text-sm font-bold rounded-xl active:scale-95 transition-transform">
                  Create
                </button>
                <button onClick={() => { setShowCreate(false); setNewName(""); }} className="px-4 py-2.5 text-sm text-[var(--muted)] hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Access */}
      {isSignedIn && (
        <div className="px-4 mt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-2">Quick Access</p>
          <div className="grid grid-cols-2 gap-2">
            <QuickCard
              icon={<Heart size={22} className="text-white fill-white" />}
              gradient="from-rose-500 to-pink-600"
              label="Liked Songs"
              count={likedPlaylist?.playlist_tracks?.[0]?.count ?? 0}
              onClick={() => selectPlaylist("liked")}
            />
            {recentlyPlayed.length > 0 && (
              <QuickCard
                icon={<Clock size={22} className="text-white" />}
                gradient="from-blue-500 to-violet-600"
                label="Recently Played"
                count={recentlyPlayed.length}
                onClick={() => selectPlaylist("recent")}
              />
            )}
          </div>
        </div>
      )}

      {/* Playlists */}
      <div className="px-4 mt-5">
        {filteredUser.length > 0 && (
          <>
            {isSignedIn && <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-2">My Playlists</p>}
            <div className="space-y-1">
              {filteredUser.map((p: Playlist, i: number) => (
                <PlaylistRow
                  key={p.id} p={p} i={i}
                  selected={selected} selectPlaylist={selectPlaylist}
                  editingId={editingId} editName={editName}
                  setEditName={setEditName} renamePlaylist={renamePlaylist}
                  setEditingId={setEditingId} isSignedIn={isSignedIn}
                  onDelete={() => deletePlaylist(p.id)}
                />
              ))}
            </div>
          </>
        )}

        {filteredSaved.length > 0 && (
          <div className={filteredUser.length > 0 ? "mt-5" : ""}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-2">
              {isSignedIn ? "Saved Playlists" : "Featured"}
            </p>
            <div className="space-y-1">
              {filteredSaved.map((p: Playlist, i: number) => (
                <PlaylistRow
                  key={p.id} p={p} i={i}
                  selected={selected} selectPlaylist={selectPlaylist}
                  editingId={editingId} editName={editName}
                  setEditName={setEditName} renamePlaylist={renamePlaylist}
                  setEditingId={setEditingId} isSignedIn={isSignedIn}
                  onDelete={isSignedIn ? () => unsavePlaylist(p.id) : undefined}
                  deleteIcon="unsave"
                />
              ))}
            </div>
          </div>
        )}

        {filteredUser.length === 0 && filteredSaved.length === 0 && isLoaded && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-4">
              <ListMusic size={28} className="text-[var(--muted)]" />
            </div>
            <p className="font-bold text-base mb-1">No playlists yet</p>
            <p className="text-[var(--muted)] text-sm">Tap + to create one</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickCard({ icon, gradient, label, count, onClick }: { icon: React.ReactNode; gradient: string; label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 text-left active:scale-95 transition-transform bg-gradient-to-br ${gradient}`}
    >
      <div className="absolute -bottom-3 -right-3 opacity-20">{icon && <div className="scale-[2.5]">{icon}</div>}</div>
      <div className="relative z-10">
        <div className="mb-3">{icon}</div>
        <p className="font-bold text-sm text-white leading-tight">{label}</p>
        <p className="text-white/60 text-xs mt-0.5">{count} tracks</p>
      </div>
    </button>
  );
}

function PlaylistRow({ p, i, selected, selectPlaylist, editingId, editName, setEditName, renamePlaylist, setEditingId, isSignedIn, onDelete, deleteIcon }: any) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
      onClick={() => selectPlaylist(p.id)}
      className={`flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
        selected === p.id ? "bg-[var(--surface-2)] ring-1 ring-[var(--primary)]/20" : "hover:bg-[var(--surface-2)]"
      }`}
    >
      {/* Cover */}
      <div className="w-14 h-14 rounded-xl bg-[var(--surface-3)] overflow-hidden shrink-0 relative">
        {p.cover_url ? (
          <Image src={p.cover_url} alt={p.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={20} className="text-[var(--muted)]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {editingId === p.id ? (
          <input
            autoFocus value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && renamePlaylist(p.id)}
            onBlur={() => renamePlaylist(p.id)}
            className="w-full bg-[var(--surface-3)] rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <>
            <p className={`font-semibold text-sm truncate ${selected === p.id ? "text-[var(--primary)]" : "text-white"}`}>{p.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {p.isAdmin && <span className="text-[8px] bg-[var(--primary)]/20 text-[var(--primary)] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Curated</span>}
              <p className="text-xs text-[var(--muted)]">{p.playlist_tracks?.[0]?.count ?? 0} tracks</p>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        {isSignedIn && !p.isAdmin && (
          <button
            onClick={() => { setEditingId(p.id); setEditName(p.name); }}
            className="p-2 rounded-xl text-[var(--muted)] hover:text-white hover:bg-white/10 transition-all"
          >
            <Edit2 size={14} />
          </button>
        )}
        {onDelete && (
          confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => { onDelete(); setConfirmDelete(false); }} className="px-2.5 py-1.5 text-xs font-bold bg-rose-500/20 text-rose-400 rounded-lg">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="px-2.5 py-1.5 text-xs font-bold bg-white/10 text-white/60 rounded-lg">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-xl text-[var(--muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-all">
              {deleteIcon === "unsave" ? <BookmarkX size={14} /> : <Trash2 size={14} />}
            </button>
          )
        )}
      </div>
    </motion.div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function DetailView({ selected, selectedName, selectedCount, selectedFull, tracks, currentTrack, isSignedIn, setQueue, removeTrack, goBack }: any) {
  const coverGradient = selected === "liked" ? "from-rose-500 to-pink-700" : selected === "recent" ? "from-blue-500 to-violet-700" : "from-[var(--surface-3)] to-[var(--surface-2)]";

  return (
    <div className="pb-32">
      {/* Hero header */}
      <div className={`relative bg-gradient-to-b ${coverGradient} to-[var(--background)] pt-12 pb-6 px-4`}>
        {/* Back button */}
        <button onClick={goBack} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform">
          <ChevronLeft size={20} className="text-white" />
        </button>

        {/* Cover art */}
        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-2xl mb-4 relative">
            {selectedFull?.cover_url ? (
              <Image src={selectedFull.cover_url} alt={selectedName} fill className="object-cover" />
            ) : selected === "liked" ? (
              <div className="w-full h-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Heart size={56} className="text-white fill-white" />
              </div>
            ) : selected === "recent" ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Clock size={56} className="text-white" />
              </div>
            ) : (
              <div className="w-full h-full bg-[var(--surface-3)] flex items-center justify-center">
                <Music size={56} className="text-[var(--muted)]" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-1">{selectedName}</h2>
          <p className="text-[var(--muted)] text-sm">{selectedCount} tracks</p>

          {/* Play / Shuffle buttons */}
          {tracks.length > 0 && (
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setQueue(tracks, 0)}
                className="flex items-center gap-2 px-8 py-3 bg-[var(--primary)] text-black font-bold text-sm rounded-full shadow-[var(--glow-primary)] active:scale-95 transition-transform"
              >
                <Play size={16} fill="currentColor" className="ml-0.5" />
                Play
              </button>
              <button
                onClick={() => setQueue([...tracks].sort(() => Math.random() - 0.5), 0)}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-bold text-sm rounded-full active:scale-95 transition-transform"
              >
                <Shuffle size={16} />
                Shuffle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Track list */}
      <div className="px-4 mt-2">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-4">
              <Music size={28} className="text-[var(--muted)]" />
            </div>
            <p className="font-bold text-base mb-1">Empty playlist</p>
            <p className="text-[var(--muted)] text-sm mb-6">Browse music to add tracks</p>
            <Link href="/browse" className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full">Browse</Link>
          </div>
        ) : (
          <div className="space-y-1">
            {tracks.map((t: Track, i: number) => (
              <TrackRow
                key={t.id} track={t} index={i} tracks={tracks}
                currentTrack={currentTrack} setQueue={setQueue}
                isSignedIn={isSignedIn} selected={selected}
                onRemove={isSignedIn && selected !== "recent" ? () => removeTrack(selected as number, t.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrackRow({ track, index, tracks, currentTrack, setQueue, isSignedIn, selected, onRemove }: { track: Track; index: number; tracks: Track[]; currentTrack: Track | null; setQueue: any; isSignedIn: boolean; selected: any; onRemove?: () => void }) {
  const isActive = currentTrack?.id === track.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => setQueue(tracks, index)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all ${isActive ? "bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/20" : "hover:bg-[var(--surface-2)]"}`}
    >
      {/* Cover */}
      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[var(--surface-3)]">
        {track.coverUrl
          ? <Image src={track.coverUrl} alt={track.title} fill className="object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-lg">♪</div>
        }
        {isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-end gap-[2px] h-4">
              {[1, 2, 3].map(i => (
                <span key={i} className="eq-bar" style={{ animationDelay: `${i * 0.15}s`, height: `${4 + i * 2}px` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isActive ? "text-[var(--primary)]" : "text-white"}`}>{track.title}</p>
        <p className="text-xs text-[var(--muted)] truncate">{track.artist}{track.featuredArtists ? ` feat. ${track.featuredArtists}` : ""}</p>
      </div>

      {/* Duration + remove */}
      <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
        {track.duration && (
          <span className="text-xs text-[var(--muted)] tabular-nums">
            {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")}
          </span>
        )}
        {onRemove && (
          <button onClick={onRemove} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
