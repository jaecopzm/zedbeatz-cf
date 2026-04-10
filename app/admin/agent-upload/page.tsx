"use client";

import { useState } from "react";
import { Upload, Music, CheckCircle, XCircle, X, Search, Download, Loader2, AlertCircle, Clock, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SearchResult = {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  cover_url?: string;
  deezer_id: string;
  source: string;
};

type ConfirmSong = SearchResult & { 
  editTitle: string; 
  editArtist: string;
  editFeaturedArtists: string;
  editAlbum: string;
  editGenre: string;
};

type UploadProgress = {
  status: string;
  progress: number;
  message: string;
  track?: any;
};

export default function AgentUploadPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Bulk selection
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [bulkConfirmSongs, setBulkConfirmSongs] = useState<ConfirmSong[] | null>(null);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);

  // Confirm modal (single song - legacy)
  const [confirmSong, setConfirmSong] = useState<ConfirmSong | null>(null);

  // Spotify playlist
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistTracks, setPlaylistTracks] = useState<SearchResult[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "playlist" | "album">("search");

  // Album state
  const [albums, setAlbums] = useState<{id: number; title: string; artist: string}[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumYear, setNewAlbumYear] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  const AGENT_API = "https://wordpress-ai-agent.fly.dev";

  function parseFeatured(artist: string): { mainArtist: string; featured: string } {
    const featMatch = artist.match(/\s*[\(\[]?\s*(?:feat|ft|with)\.?\s+(.+?)[\)\]]?\s*$/i);
    if (featMatch) {
      return {
        mainArtist: artist.slice(0, artist.search(/\s*[\(\[]?\s*(?:feat|ft|with)\.?\s+/i)).trim(),
        featured: featMatch[1].trim(),
      };
    }
    const parts = artist.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      return { mainArtist: parts[0], featured: parts.slice(1).join(", ") };
    }
    return { mainArtist: artist, featured: "" };
  }

  async function loadAlbums() {
    try {
      const res = await fetch("/api/admin/albums");
      const data = await res.json();
      setAlbums((data || []).map((a: any) => ({ id: a.id, title: a.title, artist: (a.artists as any)?.name ?? "Unknown" })));
    } catch {}
  }

  async function createAlbum() {
    if (!newAlbumTitle.trim()) return;
    setCreatingAlbum(true);
    try {
      const res = await fetch("/api/admin/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newAlbumTitle, release_year: newAlbumYear ? Number(newAlbumYear) : null }),
      });
      const album = await res.json();
      setAlbums(prev => [{ id: album.id, title: album.title, artist: "Unknown" }, ...prev]);
      setSelectedAlbumId(album.id);
      setNewAlbumTitle("");
      setNewAlbumYear("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreatingAlbum(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError("");
    setSearchResults([]);
    setSelectedSongs(new Set());

    try {
      const response = await fetch(`${AGENT_API}/music/search?query=${encodeURIComponent(searchQuery)}`, {
        method: "POST",
      });

      const data = await response.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleLoadPlaylist() {
    if (!playlistUrl.trim()) return;
    setPlaylistLoading(true);
    setError("");
    setPlaylistTracks([]);
    setSelectedSongs(new Set());
    try {
      const res = await fetch(`${AGENT_API}/music/spotify-playlist?url=${encodeURIComponent(playlistUrl)}&limit=50`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load playlist");
      setPlaylistName(data.playlist_name || "Spotify Playlist");
      const tracks: SearchResult[] = (data.tracks || []).map((t: any) => ({
        title: t.title,
        artist: t.artist,
        duration: t.duration,
        cover_url: t.cover_url,
        deezer_id: t.spotify_id || "",   // real Spotify ID or empty
        source: "Spotify",
      }));
      setPlaylistTracks(tracks);
      setSearchResults(tracks);
    } catch (err: any) {
      setError(err.message || "Failed to load playlist");
    } finally {
      setPlaylistLoading(false);
    }
  }

  function openConfirm(song: SearchResult) {
    const { mainArtist, featured } = parseFeatured(song.artist);
    setConfirmSong({ 
      ...song, 
      editTitle: song.title, 
      editArtist: mainArtist,
      editFeaturedArtists: featured,
      editAlbum: song.album || "",
      editGenre: ""
    });
  }

  function toggleSongSelection(deezer_id: string) {
    setSelectedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deezer_id)) newSet.delete(deezer_id);
      else newSet.add(deezer_id);
      return newSet;
    });
  }

  function selectAll() {
    const toSelect = searchResults.map(s => s.deezer_id);
    setSelectedSongs(new Set(toSelect));
  }

  function clearSelection() {
    setSelectedSongs(new Set());
  }

  function openBulkConfirm() {
    const songs = searchResults.filter(s => selectedSongs.has(s.deezer_id));
    const confirmSongs: ConfirmSong[] = songs.map(song => {
      const { mainArtist, featured } = parseFeatured(song.artist);
      return {
        ...song,
        editTitle: song.title,
        editArtist: mainArtist,
        editFeaturedArtists: featured,
        editAlbum: song.album || "",
        editGenre: ""
      };
    });
    setBulkConfirmSongs(confirmSongs);
    setExpandedSongId(null);
  }

  function updateBulkSong(deezer_id: string, updates: Partial<ConfirmSong>) {
    setBulkConfirmSongs(prev => 
      prev ? prev.map(s => s.deezer_id === deezer_id ? { ...s, ...updates } : s) : null
    );
  }

  async function startBulkUpload() {
    if (!bulkConfirmSongs) return;
    
    setBulkUploading(true);
    setCurrentUploadIndex(0);
    const failed: string[] = [];
    
    for (let i = 0; i < bulkConfirmSongs.length; i++) {
      setCurrentUploadIndex(i);
      setUploadProgress(null);
      try {
        await downloadAndUpload(bulkConfirmSongs[i], true);
      } catch (err) {
        failed.push(`${bulkConfirmSongs[i].editArtist} - ${bulkConfirmSongs[i].editTitle}`);
      }
    }
    
    setUploadProgress(null);
    setBulkUploading(false);
    setBulkConfirmSongs(null);
    setSelectedSongs(new Set());
    setSearchResults([]);
    setSearchQuery("");
    setResult({
      success: true,
      message: failed.length
        ? `✅ Bulk upload done. ${bulkConfirmSongs.length - failed.length} uploaded, ${failed.length} failed:\n${failed.join("\n")}`
        : `✅ All ${bulkConfirmSongs.length} songs uploaded!`,
    });
  }

  async function downloadAndUpload(song: ConfirmSong, isBulk = false) {
    if (!isBulk) {
      setConfirmSong(null);
      setDownloading(song.deezer_id);
    }
    setError("");
    setResult(null);
    setUploadProgress({ status: "starting", progress: 0, message: "Starting..." });

    try {
      // Duplicate check before hitting the agent
      const dupCheck = await fetch(
        `/api/admin/tracks?artist_name=${encodeURIComponent(song.editArtist)}&title=${encodeURIComponent(song.editTitle)}`
      ).then(r => r.json());
      if (dupCheck?.length > 0) {
        const msg = `"${song.editArtist} - ${song.editTitle}" already exists in the catalog`;
        setUploadProgress(null);
        if (!isBulk) { setDownloading(null); setResult({ success: false, skipped: true, message: msg }); }
        else { setError(msg); }
        throw new Error(msg);
      }

      const res = await fetch(`${AGENT_API}/music/start-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(song.source === "Spotify" && song.deezer_id
            ? { query: `https://open.spotify.com/track/${song.deezer_id}` }
            : song.source === "Spotify"
            ? { query: `${song.editArtist} ${song.editTitle}` }
            : { deezer_id: song.deezer_id }),
          quality: "192",
          auto_upload_to_zedbeatz: true,
          override_artist: song.editArtist,
          override_title: song.editTitle,
          override_featured: song.editFeaturedArtists || undefined,
          ...(selectedAlbumId ? { album_id: selectedAlbumId } : {})
        })
      });
      
      const { task_id } = await res.json();
      if (!task_id) throw new Error("No task ID returned");

      let attempts = 0;
      const maxAttempts = 120; // 2 minutes max
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          attempts++;
          try {
            const p = await fetch(`${AGENT_API}/music/progress/${task_id}`).then(r => r.json());
            setUploadProgress(p);
            
            if (p.status === "completed") {
              clearInterval(interval);
              if (!isBulk) {
                setDownloading(null);
                setUploadProgress(null);
                setResult({ 
                  success: true, 
                  message: `✅ ${song.editArtist} - ${song.editTitle} uploaded!`, 
                  track: p.track,
                  zedbeatz_url: p.zedbeatz_url
                });
                setSearchResults([]);
                setSearchQuery("");
              }
              resolve();
            } else if (p.status === "skipped") {
              clearInterval(interval);
              if (!isBulk) {
                setDownloading(null);
                setUploadProgress(null);
                setResult({ success: false, skipped: true, message: p.message });
              }
              resolve();
            } else if (p.status === "failed" || attempts >= maxAttempts) {
              clearInterval(interval);
              if (!isBulk) {
                setDownloading(null);
                setUploadProgress(null);
              }
              setError(p.message || "Download/upload failed");
              reject(new Error(p.message || "Failed"));
            }
          } catch (err) {
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              if (!isBulk) {
                setDownloading(null);
                setUploadProgress(null);
              }
              setError("Timeout waiting for upload");
              reject(new Error("Timeout"));
            }
          }
        }, 1000);
      });
    } catch (err: any) {
      if (!isBulk) {
        setDownloading(null);
        setUploadProgress(null);
      }
      setError(err.message || "Download failed");
      throw err;
    }
  }

  function formatDuration(seconds?: number) {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20 px-4 md:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6"
      >
        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-500 flex items-center justify-center shadow-[var(--glow-primary)]">
            <Upload size={20} className="text-black" />
          </div>
          Agent Upload
        </h1>
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-2">Search, Download & Upload to Catalog</p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Upload Progress */}
        {uploadProgress && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6 space-y-2 md:space-y-4 border-[var(--primary)]/20"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-1.5 md:gap-2 text-xs md:text-base">
                <Loader2 size={16} className="animate-spin text-[var(--primary)] md:w-[18px] md:h-[18px]" />
                <span>
                  {uploadProgress.status === "searching" && "Searching..."}
                  {uploadProgress.status === "downloading" && "Downloading..."}
                  {uploadProgress.status === "processing" && "Processing..."}
                  {uploadProgress.status === "uploading" && "Uploading to R2..."}
                </span>
              </h3>
              <span className="text-xs md:text-sm font-black text-[var(--primary)]">{uploadProgress.progress}%</span>
            </div>
            
            <div className="w-full bg-white/5 rounded-full h-1.5 md:h-2 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[var(--primary)] to-purple-500 rounded-full shadow-[var(--glow-primary)]"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <p className="text-[10px] md:text-sm text-white/60 break-words">{uploadProgress.message}</p>
          </motion.div>
        )}

        {/* Search & Download */}
        <div className="glass-card rounded-xl md:rounded-[2.5rem] p-3 md:p-6 space-y-3 md:space-y-5 border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-3 md:space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-[var(--primary)] flex items-center gap-1.5 md:gap-2">
                <Search size={14} className="md:w-4 md:h-4" />
                Search & Upload
              </h3>
              <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                <button
                  onClick={() => { setActiveTab("search"); setSearchResults([]); setSelectedSongs(new Set()); }}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === "search" ? "bg-[var(--primary)] text-black" : "text-white/40 hover:text-white"}`}
                >
                  Search
                </button>
                <button
                  onClick={() => { setActiveTab("playlist"); setSearchResults([]); setSelectedSongs(new Set()); }}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === "playlist" ? "bg-[var(--primary)] text-black" : "text-white/40 hover:text-white"}`}
                >
                  Playlist
                </button>
                <button
                  onClick={() => { setActiveTab("album"); setSearchResults([]); setSelectedSongs(new Set()); loadAlbums(); }}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === "album" ? "bg-[var(--primary)] text-black" : "text-white/40 hover:text-white"}`}
                >
                  Album
                </button>
              </div>
            </div>

          {activeTab === "search" && (
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <input
              type="text"
              placeholder="Search for songs (e.g., Yo Maps Aweah)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={downloading !== null}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm font-medium outline-none focus:border-[var(--primary)] transition-all disabled:opacity-50 placeholder:text-white/20"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim() || downloading !== null}
              className="px-4 py-2 md:px-6 md:py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-black text-[10px] md:text-xs uppercase tracking-widest rounded-lg md:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 md:gap-2 shrink-0 shadow-[var(--glow-primary)]"
            >
              {searching ? <Loader2 size={14} className="animate-spin md:w-4 md:h-4" /> : <Search size={14} className="md:w-4 md:h-4" />}
              <span className="whitespace-nowrap">{searching ? "Searching..." : "Search"}</span>
            </button>
          </div>
          )}

          {activeTab === "playlist" && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <input
                type="text"
                placeholder="https://open.spotify.com/playlist/... or /album/..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoadPlaylist()}
                disabled={playlistLoading}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm font-medium outline-none focus:border-[var(--primary)] transition-all disabled:opacity-50 placeholder:text-white/20"
              />
              <button
                onClick={handleLoadPlaylist}
                disabled={playlistLoading || !playlistUrl.trim()}
                className="px-4 py-2 md:px-6 md:py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-black text-[10px] md:text-xs uppercase tracking-widest rounded-lg md:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 md:gap-2 shrink-0 shadow-[var(--glow-primary)]"
              >
                {playlistLoading ? <Loader2 size={14} className="animate-spin" /> : <Music size={14} />}
                <span>{playlistLoading ? "Loading..." : "Load"}</span>
              </button>
            </div>
            {playlistName && playlistTracks.length > 0 && (
              <p className="text-[10px] text-white/40 font-medium">
                <span className="text-[var(--primary)] font-black">{playlistTracks.length} tracks</span> from &ldquo;{playlistName}&rdquo;
              </p>
            )}
          </div>
          )}

          {activeTab === "album" && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5 block">Select Album</label>
              <select
                value={selectedAlbumId ?? ""}
                onChange={e => setSelectedAlbumId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--primary)] transition-all"
              >
                <option value="">— No album —</option>
                {albums.map(a => <option key={a.id} value={a.id}>{a.title} · {a.artist}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input placeholder="New album title" value={newAlbumTitle} onChange={e => setNewAlbumTitle(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--primary)] transition-all placeholder:text-white/20" />
              <input placeholder="Year" value={newAlbumYear} onChange={e => setNewAlbumYear(e.target.value)}
                className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--primary)] transition-all placeholder:text-white/20" />
              <button onClick={createAlbum} disabled={creatingAlbum || !newAlbumTitle.trim()}
                className="px-3 py-2 bg-[var(--primary)] text-black text-[10px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50 shrink-0">
                {creatingAlbum ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              </button>
            </div>
            {selectedAlbumId && <p className="text-[10px] text-[var(--primary)] font-bold">✓ Album selected — search or paste a Spotify playlist URL below</p>}
            <div className="flex gap-2">
              <input type="text" placeholder="Search songs or paste Spotify playlist/album URL"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key !== "Enter") return; if (searchQuery.includes("spotify.com/playlist") || searchQuery.includes("spotify.com/album")) { setPlaylistUrl(searchQuery); handleLoadPlaylist(); } else { handleSearch(); } }}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--primary)] transition-all placeholder:text-white/20" />
              <button
                onClick={() => { if (searchQuery.includes("spotify.com/playlist") || searchQuery.includes("spotify.com/album")) { setPlaylistUrl(searchQuery); handleLoadPlaylist(); } else { handleSearch(); } }}
                disabled={searching || playlistLoading || !searchQuery.trim()}
                className="px-4 py-2 bg-[var(--primary)] text-black text-[10px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                {(searching || playlistLoading) ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                Go
              </button>
            </div>
          </div>
          )}

          {/* Search Results / Playlist Tracks */}
          {searchResults.length > 0 && (
            <div className="space-y-2 md:space-y-4">
              <div className="flex items-center justify-between gap-2 md:gap-3 flex-wrap">
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={selectAll}
                    disabled={downloading !== null}
                    className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--primary)] hover:underline disabled:opacity-50"
                  >
                    Select All
                  </button>
                  <span className="text-white/20">•</span>
                  <button
                    onClick={clearSelection}
                    disabled={downloading !== null || selectedSongs.size === 0}
                    className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
                {selectedSongs.size > 0 && (
                  <button
                    onClick={openBulkConfirm}
                    disabled={downloading !== null}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg md:rounded-xl disabled:opacity-50 transition-all flex items-center gap-1.5 md:gap-2 shadow-[var(--glow-primary)]"
                  >
                    <Download size={12} className="md:w-[14px] md:h-[14px]" />
                    Upload ({selectedSongs.size})
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                {searchResults.map((song, idx) => {
                  const isSelected = selectedSongs.has(song.deezer_id);
                  return (
                    <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg transition-all ${isSelected ? 'bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]' : 'bg-white/5 border border-white/5'}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSongSelection(song.deezer_id)}
                        disabled={downloading !== null}
                        className="w-4 h-4 rounded accent-[var(--primary)] shrink-0 cursor-pointer disabled:opacity-50"
                      />
                      {song.cover_url && (
                        <img src={song.cover_url} alt={song.title} className="w-9 h-9 rounded object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-xs">{song.title}</p>
                        <p className="text-[10px] text-white/50 truncate">{song.artist}{song.duration ? ` · ${formatDuration(song.duration)}` : ""}</p>
                      </div>
                      <button
                        onClick={() => openConfirm(song)}
                        disabled={downloading !== null}
                        className="p-1.5 bg-[var(--primary)] text-black rounded-lg disabled:opacity-50 shrink-0"
                      >
                        {downloading === song.deezer_id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Download size={13} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 md:p-5 flex items-start gap-3 border-red-500/20 bg-red-500/5"
          >
            <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-red-500 text-sm uppercase tracking-widest">Upload Failed</p>
              <p className="text-xs md:text-sm text-red-400 mt-1 break-words">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-300 shrink-0">
              <XCircle size={16} />
            </button>
          </motion.div>
        )}

        {/* Skipped */}
        {result?.skipped && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 md:p-5 flex items-start gap-3 border-yellow-500/20 bg-yellow-500/5"
          >
            <AlertCircle size={20} className="text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-yellow-400 text-sm uppercase tracking-widest">Song Skipped</p>
              <p className="text-xs md:text-sm text-yellow-300/60 mt-1 break-words">{result.message}</p>
            </div>
            <button onClick={() => setResult(null)} className="text-yellow-400/60 hover:text-yellow-300 shrink-0"><XCircle size={16} /></button>
          </motion.div>
        )}

        {/* Success */}
        {result && !result.skipped && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 md:p-5 space-y-3 border-[var(--primary)]/20 bg-[var(--primary)]/5"
          >
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-[var(--primary)] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-[var(--primary)] text-sm uppercase tracking-widest">Upload Successful!</p>
                <p className="text-xs md:text-sm text-white/60 mt-1 break-words">{result.message}</p>
              </div>
              <button onClick={() => setResult(null)} className="text-white/40 hover:text-white shrink-0">
                <XCircle size={16} />
              </button>
            </div>

            {result.track && (
              <>
                <div className="bg-white/5 rounded-xl p-4 space-y-2 text-xs md:text-sm overflow-x-auto border border-white/5">
                  {result.track.id && <div className="flex justify-between gap-4"><span className="text-white/40 shrink-0 font-medium">Track ID:</span><span className="font-mono truncate">{result.track.id}</span></div>}
                  {result.track.title && <div className="flex justify-between gap-4"><span className="text-white/40 shrink-0 font-medium">Title:</span><span className="truncate font-bold">{result.track.title}</span></div>}
                  {result.track.artist_id && <div className="flex justify-between gap-4"><span className="text-white/40 shrink-0 font-medium">Artist ID:</span><span className="font-mono truncate">{result.track.artist_id}</span></div>}
                  {result.track.audio_key && <div className="flex justify-between gap-4"><span className="text-white/40 shrink-0 font-medium">Audio:</span><span className="text-xs text-[var(--primary)] font-black">✅ Uploaded</span></div>}
                  {result.track.cover_key && <div className="flex justify-between gap-4"><span className="text-white/40 shrink-0 font-medium">Cover:</span><span className="text-xs text-[var(--primary)] font-black">✅ Uploaded</span></div>}
                </div>
                {result.track.id && (
                  <a href={result.track.slug ? `/track/${result.track.slug}` : `/track/${result.track.id}`} className="block w-full py-3 text-center rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black transition-all text-sm font-black uppercase tracking-widest shadow-[var(--glow-primary)]">
                    View Track →
                  </a>
                )}
              </>
            )}
          </motion.div>
        )}

      </div>

      {/* Confirm & Edit Modal (Single) */}
      {confirmSong && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] rounded-xl md:rounded-2xl w-full max-w-md p-3 md:p-6 space-y-3 md:space-y-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start gap-2 md:gap-4">
              {confirmSong.cover_url && (
                <img src={confirmSong.cover_url} alt={confirmSong.editTitle} className="w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl object-cover shadow-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] md:text-xs text-[var(--muted)] uppercase tracking-wide mb-0.5 md:mb-1">Confirm Upload</p>
                <p className="font-semibold text-sm md:text-lg truncate">{confirmSong.title}</p>
                <p className="text-xs md:text-sm text-[var(--muted)] truncate">{confirmSong.artist}</p>
                {confirmSong.album && <p className="text-[10px] md:text-xs text-[var(--muted)] mt-0.5 md:mt-1 truncate">{confirmSong.album}</p>}
              </div>
            </div>

            <div className="space-y-2 md:space-y-3">
              <div>
                <label className="text-[10px] md:text-xs font-medium text-[var(--muted)] mb-1 md:mb-1.5 block">Title</label>
                <input
                  value={confirmSong.editTitle}
                  onChange={e => setConfirmSong({ ...confirmSong, editTitle: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="Track title"
                />
              </div>
              <div>
                <label className="text-[10px] md:text-xs font-medium text-[var(--muted)] mb-1 md:mb-1.5 block">Main Artist</label>
                <input
                  value={confirmSong.editArtist}
                  onChange={e => setConfirmSong({ ...confirmSong, editArtist: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="Main artist name"
                />
              </div>
              <div>
                <label className="text-[10px] md:text-xs font-medium text-[var(--muted)] mb-1 md:mb-1.5 block">Featured Artists (optional)</label>
                <input
                  value={confirmSong.editFeaturedArtists}
                  onChange={e => setConfirmSong({ ...confirmSong, editFeaturedArtists: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="e.g., Mampi, Joei"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                <div>
                  <label className="text-[10px] md:text-xs font-medium text-[var(--muted)] mb-1 md:mb-1.5 block">Album</label>
                  <input
                    value={confirmSong.editAlbum}
                    onChange={e => setConfirmSong({ ...confirmSong, editAlbum: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                    placeholder="Album name"
                  />
                </div>
                <div>
                  <label className="text-[10px] md:text-xs font-medium text-[var(--muted)] mb-1 md:mb-1.5 block">Genre</label>
                  <input
                    value={confirmSong.editGenre}
                    onChange={e => setConfirmSong({ ...confirmSong, editGenre: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                    placeholder="e.g., Afrobeat"
                  />
                </div>
              </div>
              {confirmSong.duration && (
                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-[var(--muted)]">
                  <Clock size={12} className="md:w-[14px] md:h-[14px]" />
                  <span>Duration: {Math.floor(confirmSong.duration / 60)}:{(confirmSong.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-[var(--background)] rounded-lg text-[10px] md:text-xs text-[var(--muted)]">
              <AlertCircle size={12} className="shrink-0 md:w-[14px] md:h-[14px]" />
              <p>This will download, tag, and upload the song to ZedBeatz R2 storage.</p>
            </div>

            <div className="flex gap-2 md:gap-3 pt-1">
              <button
                onClick={() => setConfirmSong(null)}
                className="flex-1 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-[var(--border)] text-xs md:text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => downloadAndUpload(confirmSong)}
                disabled={!confirmSong.editTitle.trim() || !confirmSong.editArtist.trim()}
                className="flex-1 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} className="md:w-4 md:h-4" /> Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Confirm & Edit Modal */}
      {bulkConfirmSongs && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] rounded-xl w-full max-w-lg p-3 space-y-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest">Confirm Upload</h3>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {bulkUploading ? `Uploading ${currentUploadIndex + 1} of ${bulkConfirmSongs.length}...` : `${bulkConfirmSongs.length} songs`}
                </p>
              </div>
              {!bulkUploading && (
                <button onClick={() => setBulkConfirmSongs(null)} className="text-white/40 hover:text-white p-1">
                  <X size={18} />
                </button>
              )}
            </div>

            {bulkUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>{uploadProgress?.message || "Starting..."}</span>
                  <span>{currentUploadIndex + 1}/{bulkConfirmSongs.length}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${((currentUploadIndex / bulkConfirmSongs.length) * 100) + ((uploadProgress?.progress ?? 0) / bulkConfirmSongs.length)}%` }} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {bulkConfirmSongs.map((song, idx) => {
                const isExpanded = expandedSongId === song.deezer_id;
                const isUploading = bulkUploading && idx === currentUploadIndex;
                const isCompleted = bulkUploading && idx < currentUploadIndex;
                return (
                  <div key={song.deezer_id} className={`rounded-lg overflow-hidden border ${isUploading ? 'border-[var(--primary)]' : 'border-white/5'} bg-white/5`}>
                    <div className="flex items-center gap-2 p-2">
                      {song.cover_url && <img src={song.cover_url} alt={song.editTitle} className="w-9 h-9 rounded object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-xs">{song.editTitle}</p>
                        <p className="text-[10px] text-white/40 truncate">{song.editArtist}{song.editFeaturedArtists && ` feat. ${song.editFeaturedArtists}`}{song.editGenre && ` · ${song.editGenre}`}</p>
                      </div>
                      {isCompleted && <CheckCircle size={14} className="text-[var(--primary)] shrink-0" />}
                      {isUploading && <Loader2 size={14} className="animate-spin text-[var(--primary)] shrink-0" />}
                      {!bulkUploading && (
                        <button onClick={() => setExpandedSongId(isExpanded ? null : song.deezer_id)} className="p-1 text-white/40 shrink-0">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                    {isExpanded && !bulkUploading && (
                      <div className="px-2 pb-2 space-y-2 border-t border-white/5 pt-2">
                        {[
                          { label: "Title", key: "editTitle" },
                          { label: "Artist", key: "editArtist" },
                          { label: "Featured", key: "editFeaturedArtists", placeholder: "Optional" },
                          { label: "Genre", key: "editGenre", placeholder: "e.g. Afrobeat" },
                        ].map(({ label, key, placeholder }) => (
                          <div key={key}>
                            <label className="text-[10px] text-white/40 mb-1 block">{label}</label>
                            <input
                              value={(song as any)[key]}
                              onChange={e => updateBulkSong(song.deezer_id, { [key]: e.target.value } as any)}
                              placeholder={placeholder}
                              className="w-full bg-[var(--background)] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[var(--primary)]"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setBulkConfirmSongs(null)} disabled={bulkUploading} className="flex-1 py-2 rounded-lg border border-white/10 text-xs font-bold disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={startBulkUpload}
                disabled={bulkUploading || bulkConfirmSongs.some(s => !s.editTitle.trim() || !s.editArtist.trim())}
                className="flex-1 py-2 rounded-lg bg-[var(--primary)] text-black text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {bulkUploading ? <><Loader2 size={13} className="animate-spin" /> Uploading...</> : <><Download size={13} /> Upload All</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
