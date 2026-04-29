'use client';

import { useEffect, useState } from "react";
import { Plus, Play, Pause, Music, Heart, Clock, Search, X, Edit2, Trash2, BookmarkX, ChevronLeft, MoreVertical, Shuffle } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, SignInButton } from "@clerk/nextjs";
import { ListMusic } from "lucide-react";
import { useRouter } from "next/navigation";
import "@/app/styles/collection-page.css";
import { TrackMenu } from "@/components/track-menu";
import { QuickCard } from "@/components/library/quick-card";
import { LibraryDetailView } from "@/components/library/detail-view";

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
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [newName, setNewName] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isSignedIn, isLoaded, router]);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<number | "recent" | "liked" | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [view, setView] = useState<ViewState>("list");
  const { setQueue, currentTrack } = usePlayer();
  const [searchQuery, setSearchQuery] = useState("");
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
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)] px-4 pt-3 pb-2.5">
        <div className="flex items-center justify-between mb-2.5">
          <h1 className="text-xl font-black tracking-tight">Library</h1>
          {isSignedIn ? (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus size={16} className="text-black" strokeWidth={2.5} />
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                <Plus size={16} className="text-[var(--primary)]" />
              </button>
            </SignInButton>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search playlists..."
            className="w-full bg-[var(--surface-2)] rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]/40 transition-all placeholder:text-[var(--muted)]"
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
        <div className="px-4 mt-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-2">Quick Access</p>
          <div className="grid grid-cols-2 gap-2">
            <QuickCard
              icon={<Heart size={18} className="text-white fill-white" />}
              gradient="from-rose-500 to-pink-600"
              label="Liked Songs"
              count={likedPlaylist?.playlist_tracks?.[0]?.count ?? 0}
              onClick={() => selectPlaylist("liked")}
            />
            {recentlyPlayed.length > 0 && (
              <QuickCard
                icon={<Clock size={18} className="text-white" />}
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
      <div className="px-4 mt-4">
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

function PlaylistRow({ p, i, selected, selectPlaylist, editingId, editName, setEditName, renamePlaylist, setEditingId, isSignedIn, onDelete, deleteIcon }: any) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      onClick={() => selectPlaylist(p.id)}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
        selected === p.id ? "bg-[var(--surface-2)] ring-1 ring-[var(--primary)]/20" : "hover:bg-[var(--surface-2)]"
      }`}
    >
      {/* Cover */}
      <div className="w-11 h-11 rounded-lg bg-[var(--surface-3)] overflow-hidden shrink-0 relative">
        {p.cover_url ? (
          <Image src={p.cover_url} alt={p.name} fill sizes="44px" className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={16} className="text-[var(--muted)]" />
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
            className="w-full bg-[var(--surface-3)] rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
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
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-white hover:bg-white/10 transition-all"
          >
            <Edit2 size={13} />
          </button>
        )}
        {onDelete && (
          confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => { onDelete(); setConfirmDelete(false); }} className="px-2 py-1 text-xs font-bold bg-rose-500/20 text-rose-400 rounded-lg">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 text-xs font-bold bg-white/10 text-white/60 rounded-lg">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-all">
              {deleteIcon === "unsave" ? <BookmarkX size={13} /> : <Trash2 size={13} />}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function DetailView({ selected, selectedName, selectedCount, selectedFull, tracks, currentTrack, isSignedIn, setQueue, removeTrack, goBack }: any) {
  const { playing, toggle, currentIndex, queue } = usePlayer();
  const isPlaylistQueue = queue.length === tracks.length && tracks.every((t: Track, i: number) => queue[i]?.id === t.id);

  return (
    <LibraryDetailView
      selected={selected}
      selectedName={selectedName}
      selectedCount={selectedCount}
      selectedFull={selectedFull}
      tracks={tracks}
      isSignedIn={isSignedIn}
      setQueue={setQueue}
      removeTrack={removeTrack}
      goBack={goBack}
    >
      {tracks.map((t: Track, i: number) => (
        <LibraryTrackRow
          key={t.id}
          track={t}
          index={i}
          tracks={tracks}
          isCurrent={isPlaylistQueue && i === currentIndex}
          isPlaying={playing}
          onPlay={() => isPlaylistQueue && i === currentIndex ? toggle() : setQueue(tracks, i)}
          onRemove={isSignedIn && selected !== "recent" ? () => removeTrack(selected as number, t.id) : undefined}
        />
      ))}
    </LibraryDetailView>
  );
}

function LibraryTrackRow({ track, index, tracks, isCurrent, isPlaying, onPlay, onRemove }: { track: Track; index: number; tracks: Track[]; isCurrent: boolean; isPlaying: boolean; onPlay: () => void; onRemove?: () => void }) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className={`track-row ${isCurrent ? "track-row--active" : ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="track-index" onClick={onPlay}>
        <span className={`track-num ${isCurrent ? "track-num--current" : ""} ${hovering ? "track-num--hidden" : ""}`}>
          {isCurrent && isPlaying ? (
            <span className="eq-container">
              {[0.3, 0.7, 0.5, 0.9, 0.4].map((delay, i) => (
                <span key={i} className="eq-bar eq-bar--active" style={{ animationDelay: `${delay}s` }} />
              ))}
            </span>
          ) : (
            <>{isCurrent ? "▶" : index + 1}</>
          )}
        </span>
        <span className={`track-play-icon ${hovering ? "track-play-icon--visible" : ""} ${isCurrent ? "track-play-icon--current" : ""}`}>
          {isCurrent && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </span>
      </div>

      <div className="track-info">
        <div className="track-thumb">
          {track.coverUrl ? (
            <Image src={track.coverUrl} alt={track.title} width={40} height={40} className="track-thumb-img" />
          ) : (
            <div className="track-thumb-fallback">
              <Music size={16} />
            </div>
          )}
        </div>
        <div className="track-meta">
          <button className={`track-title ${isCurrent ? "track-title--current" : ""}`} onClick={onPlay}>
            {track.title}
          </button>
          <div className="track-sub">
            <Link href={track.artistSlug ? `/artist/${track.artistSlug}` : track.artistId ? `/artist/${track.artistId}` : "/browse"} className="track-artist">
              {track.artist}
            </Link>
            {track.featuredArtists && <span className="track-feat">, {track.featuredArtists}</span>}
          </div>
        </div>
      </div>

      <div className="track-artist-col">
        <Link href={track.artistSlug ? `/artist/${track.artistSlug}` : track.artistId ? `/artist/${track.artistId}` : "/browse"} className="track-artist-link">
          {track.featuredArtists ? `${track.artist} feat. ${track.featuredArtists}` : track.artist}
        </Link>
      </div>

      <div className="track-actions">
        {track.duration && (
          <span className="track-duration">
            {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")}
          </span>
        )}
        {onRemove && (
          <button 
            className={`track-more ${hovering ? "track-more--visible" : ""}`}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label="Remove from playlist"
          >
            <X size={16} />
          </button>
        )}
        <div className={hovering ? "track-more--visible" : ""}>
          <TrackMenu track={track} />
        </div>
      </div>
    </div>
  );
}
