"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const BACKEND = "https://backend.zedbeatz.com";

// ---------- helpers ----------
function useAdminSecret() {
  const [secret, setSecret] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setSecret(localStorage.getItem("adminSecret"));
    setMounted(true);
  }, []);
  const unlock = () => {
    const v = input.trim();
    if (!v) return;
    localStorage.setItem("adminSecret", v);
    setSecret(v);
    setInput("");
  };
  const lock = () => {
    localStorage.removeItem("adminSecret");
    setSecret(null);
    setInput("");
  };
  return { secret, input, setInput, unlock, lock, mounted };
}

async function adminFetch(secret: string, path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    "x-admin-secret": secret,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BACKEND}${path}`, { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = typeof data === "object" && data !== null && "error" in (data as Record<string, unknown>)
      ? String((data as Record<string, string>).error)
      : `HTTP ${res.status}: ${text.slice(0, 300)}`;
    throw new Error(msg);
  }
  return data;
}

// ---------- Gate ----------
function Gate({ secret, input, setInput, unlock, lock, mounted }: ReturnType<typeof useAdminSecret>) {
  if (!mounted) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!secret) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Unlock</CardTitle>
            <CardDescription>Enter ADMIN_SECRET to access the backend at {BACKEND}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-secret">x-admin-secret</Label>
              <Input
                id="admin-secret"
                type="password"
                placeholder="ADMIN_SECRET"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && unlock()}
              />
            </div>
            <Button onClick={unlock} className="w-full" disabled={!input.trim()}>Unlock</Button>
            <p className="text-xs text-muted-foreground">Stored in localStorage key &lsquo;adminSecret&rsquo; and sent as <code className="bg-muted px-1 py-0.5 rounded">x-admin-secret</code> on every fetch.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="secondary">Unlocked</Badge>
        <span className="text-muted-foreground truncate max-w-[220px]">{secret.slice(0, 4)}••••</span>
      </div>
      <Button variant="outline" size="sm" onClick={lock}>Lock</Button>
    </div>
  );
}

// ---------- Tracks Tab ----------
function TracksTab({ secret }: { secret: string }) {
  const [tracks, setTracks] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", artist_id: "", genre: "", featured_artists: "", cover_url: "", audio_key: "", duration: "" });
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const fetchTracks = useCallback(async (search?: string) => {
    setLoading(true); setError(null);
    try {
      const qs = search?.trim() ? `?limit=100` : "?limit=100";
      // backend supports ?title and ?artist_name for singular exact, but for list we client-filter
      const data = await adminFetch(secret, `/api/v1/admin/tracks${qs}`);
      const arr = Array.isArray(data) ? data as Record<string, unknown>[] : [];
      setTracks(arr);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [secret]);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  const filtered = tracks.filter((t) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    const title = String((t as Record<string, unknown>).title ?? "").toLowerCase();
    const artist = String((t as Record<string, unknown>).artist_name ?? (t as Record<string, unknown>).artistName ?? "").toLowerCase();
    return title.includes(needle) || artist.includes(needle);
  });

  const handleCreate = async () => {
    if (!form.title.trim() || !form.artist_id.trim()) { setError("title + artist_id required"); return; }
    setCreating(true); setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        artist_id: isNaN(Number(form.artist_id)) ? form.artist_id : Number(form.artist_id),
        genre: form.genre.trim() || undefined,
        featured_artists: form.featured_artists.trim() || undefined,
        cover_url: form.cover_url.trim() || undefined,
        audio_key: form.audio_key.trim() || undefined,
      };
      if (form.duration.trim()) payload.duration = Number(form.duration);
      // strip undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      await adminFetch(secret, "/api/v1/admin/tracks", { method: "POST", body: JSON.stringify(payload) });
      setForm({ title: "", artist_id: "", genre: "", featured_artists: "", cover_url: "", audio_key: "", duration: "" });
      await fetchTracks();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: unknown) => {
    if (!confirm(`Delete track ${id}?`)) return;
    setError(null);
    try {
      await adminFetch(secret, "/api/v1/admin/tracks", { method: "DELETE", body: JSON.stringify({ id }) });
      await fetchTracks();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const startEdit = (t: Record<string, unknown>) => {
    setEditId(t.id as number);
    setEditForm({
      title: String(t.title ?? ""),
      genre: String(t.genre ?? ""),
      featured_artists: String(t.featured_artists ?? t.featuredArtists ?? ""),
      cover_url: String(t.cover_url ?? t.coverUrl ?? ""),
      audio_key: String(t.audio_key ?? t.audioKey ?? ""),
    });
  };

  const handlePatch = async () => {
    if (editId == null) return;
    setError(null);
    try {
      const payload: Record<string, unknown> = { id: editId };
      if (editForm.title) payload.title = editForm.title;
      if (editForm.genre !== undefined) payload.genre = editForm.genre;
      if (editForm.featured_artists !== undefined) payload.featured_artists = editForm.featured_artists;
      if (editForm.cover_url !== undefined) payload.cover_url = editForm.cover_url;
      if (editForm.audio_key !== undefined) payload.audio_key = editForm.audio_key;
      await adminFetch(secret, "/api/v1/admin/tracks", { method: "PATCH", body: JSON.stringify(payload) });
      setEditId(null); setEditForm({});
      await fetchTracks();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px] space-y-1">
          <Label>Search title / artist (client filter)</Label>
          <Input placeholder="Filter tracks…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => fetchTracks()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create track</CardTitle>
          <CardDescription>POST /api/v1/admin/tracks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Song title" /></div>
            <div className="space-y-1"><Label>Artist ID *</Label><Input value={form.artist_id} onChange={e => setForm(f => ({ ...f, artist_id: e.target.value }))} placeholder="e.g. 6 or hashid" /></div>
            <div className="space-y-1"><Label>Genre</Label><Input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} placeholder="Afrobeat" /></div>
            <div className="space-y-1"><Label>Featured artists</Label><Input value={form.featured_artists} onChange={e => setForm(f => ({ ...f, featured_artists: e.target.value }))} placeholder="Chile One, Kell Kay" /></div>
            <div className="space-y-1"><Label>Cover URL</Label><Input value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} placeholder="https://…" /></div>
            <div className="space-y-1"><Label>Audio key</Label><Input value={form.audio_key} onChange={e => setForm(f => ({ ...f, audio_key: e.target.value }))} placeholder="audio/xyz.mp3" /></div>
            <div className="space-y-1"><Label>Duration (sec)</Label><Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="210" /></div>
          </div>
          <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create"}</Button>
        </CardContent>
      </Card>

      {error && <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground">Loading tracks…</div>}

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{loading ? "Loading…" : "No tracks"}</TableCell></TableRow>
            ) : filtered.slice(0, 100).map((t) => {
              const id = t.id as number;
              const isEditing = editId === id;
              return (
                <TableRow key={String(id)}>
                  <TableCell className="font-mono text-xs">{String(id)}</TableCell>
                  <TableCell>
                    {isEditing ? <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="h-7" /> : String(t.title ?? "")}
                    {t.featured_artists ? <div className="text-xs text-muted-foreground">ft. {String(t.featured_artists)}</div> : null}
                  </TableCell>
                  <TableCell className="text-xs">{String((t as Record<string, unknown>).artist_name ?? (t as Record<string, unknown>).artistName ?? (t as Record<string, unknown>).artist_id ?? "")}</TableCell>
                  <TableCell>{isEditing ? <Input value={editForm.genre} onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))} className="h-7" /> : String(t.genre ?? "-")}</TableCell>
                  <TableCell className="text-xs max-w-[160px] truncate">{String(t.slug ?? "")}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {isEditing ? (
                      <>
                        <Button size="xs" onClick={handlePatch}>Save</Button>
                        <Button size="xs" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="xs" variant="outline" onClick={() => startEdit(t as Record<string, unknown>)}>Edit</Button>
                        <Button size="xs" variant="destructive" onClick={() => handleDelete(id)}>Delete</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} tracks (capped at 100). DELETE sends <code className="bg-muted px-1 rounded">{"{id}"}</code> in JSON body; PATCH needs <code className="bg-muted px-1 rounded">id</code>.</p>
    </div>
  );
}

// ---------- Artists Tab ----------
function ArtistsTab({ secret }: { secret: string }) {
  const [artists, setArtists] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [q, setQ] = useState("");

  const fetchArtists = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminFetch(secret, "/api/v1/admin/artists");
      setArtists(Array.isArray(data) ? data as Record<string, unknown>[] : []);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [secret]);
  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  const handleCreate = async () => {
    if (!name.trim()) { setError("name required"); return; }
    setError(null);
    try {
      await adminFetch(secret, "/api/v1/admin/artists", { method: "POST", body: JSON.stringify({ name: name.trim(), bio: bio.trim() || undefined }) });
      setName(""); setBio("");
      await fetchArtists();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const handleDelete = async (id: unknown) => {
    if (!confirm(`Delete artist ${id}?`)) return;
    try {
      await adminFetch(secret, `/api/v1/admin/artists/${id}`, { method: "DELETE" });
      await fetchArtists();
    } catch (e) {
      // fallback to body id
      try { await adminFetch(secret, "/api/v1/admin/artists", { method: "DELETE", body: JSON.stringify({ id }) }); await fetchArtists(); }
      catch (e2) { setError(e2 instanceof Error ? e2.message : String(e2)); }
    }
  };

  const filtered = artists.filter(a => !q.trim() || String(a.name ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <div className="space-y-1 flex-1 min-w-[180px]"><Label>Search</Label><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter artists…" /></div>
        <Button variant="outline" onClick={fetchArtists} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Create artist</CardTitle><CardDescription>POST /api/v1/admin/artists</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Yo Maps" /></div>
            <div className="space-y-1"><Label>Bio</Label><Input value={bio} onChange={e => setBio(e.target.value)} placeholder="Optional bio" /></div>
          </div>
          <Button onClick={handleCreate}>Create</Button>
        </CardContent>
      </Card>
      {error && <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">{error}</div>}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">{loading ? "Loading…" : "No artists"}</TableCell></TableRow> :
              filtered.slice(0, 200).map(a => (
                <TableRow key={String(a.id)}>
                  <TableCell className="font-mono text-xs">{String(a.id)}</TableCell>
                  <TableCell>{String(a.name ?? "")}</TableCell>
                  <TableCell className="text-right"><Button size="xs" variant="destructive" onClick={() => handleDelete(a.id)}>Delete</Button></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------- Albums Tab ----------
function AlbumsTab({ secret }: { secret: string }) {
  const [albums, setAlbums] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", artist_id: "", release_year: "" });

  const fetchAlbums = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminFetch(secret, "/api/v1/admin/albums");
      setAlbums(Array.isArray(data) ? data as Record<string, unknown>[] : []);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [secret]);
  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const handleCreate = async () => {
    if (!form.title.trim()) { setError("title required"); return; }
    setError(null);
    try {
      const payload: Record<string, unknown> = { title: form.title.trim() };
      if (form.artist_id.trim()) payload.artist_id = isNaN(Number(form.artist_id)) ? form.artist_id : Number(form.artist_id);
      if (form.release_year.trim()) payload.release_year = Number(form.release_year);
      await adminFetch(secret, "/api/v1/admin/albums", { method: "POST", body: JSON.stringify(payload) });
      setForm({ title: "", artist_id: "", release_year: "" });
      await fetchAlbums();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const handleDelete = async (id: unknown) => {
    if (!confirm(`Delete album ${id}?`)) return;
    try {
      await adminFetch(secret, "/api/v1/admin/albums", { method: "DELETE", body: JSON.stringify({ id }) });
      await fetchAlbums();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-medium">Albums</h3><Button variant="outline" size="sm" onClick={fetchAlbums} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button></div>
      <Card>
        <CardHeader><CardTitle className="text-base">Create album</CardTitle><CardDescription>POST /api/v1/admin/albums</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Album title" /></div>
            <div className="space-y-1"><Label>Artist ID</Label><Input value={form.artist_id} onChange={e => setForm(f => ({ ...f, artist_id: e.target.value }))} placeholder="6" /></div>
            <div className="space-y-1"><Label>Release year</Label><Input value={form.release_year} onChange={e => setForm(f => ({ ...f, release_year: e.target.value }))} placeholder="2024" /></div>
          </div>
          <Button onClick={handleCreate}>Create</Button>
        </CardContent>
      </Card>
      {error && <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">{error}</div>}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Title</TableHead><TableHead>Artist</TableHead><TableHead>Year</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {albums.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{loading ? "Loading…" : "No albums"}</TableCell></TableRow> :
              albums.map(a => (
                <TableRow key={String(a.id)}>
                  <TableCell className="font-mono text-xs">{String(a.id)}</TableCell>
                  <TableCell>{String(a.title ?? "")}</TableCell>
                  <TableCell className="text-xs">{String((a as Record<string, unknown>).artistName ?? (a as Record<string, unknown>).artist_name ?? (a as Record<string, unknown>).artist_id ?? "")}</TableCell>
                  <TableCell>{String((a as Record<string, unknown>).release_year ?? (a as Record<string, unknown>).releaseYear ?? "-")}</TableCell>
                  <TableCell className="text-right"><Button size="xs" variant="destructive" onClick={() => handleDelete(a.id)}>Delete</Button></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------- Hero Tab ----------
function HeroTab({ secret }: { secret: string }) {
  const [slots, setSlots] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTrackId, setNewTrackId] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fetchHero = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminFetch(secret, "/api/v1/admin/hero");
      setSlots(Array.isArray(data) ? data as Record<string, unknown>[] : []);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [secret]);
  useEffect(() => { fetchHero(); }, [fetchHero]);

  const handleAdd = async () => {
    if (!newTrackId.trim()) return;
    setError(null);
    try {
      const tid = isNaN(Number(newTrackId)) ? newTrackId.trim() : Number(newTrackId.trim());
      await adminFetch(secret, "/api/v1/admin/hero", { method: "POST", body: JSON.stringify({ track_id: tid }) });
      setNewTrackId("");
      await fetchHero();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const handleRemove = async (trackId: unknown) => {
    if (!confirm(`Remove track ${trackId} from hero?`)) return;
    setError(null);
    try {
      await adminFetch(secret, "/api/v1/admin/hero", { method: "DELETE", body: JSON.stringify({ track_id: trackId }) });
      await fetchHero();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= slots.length) return;
    const copy = [...slots];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    setSlots(copy);
  };

  const handleSaveOrder = async () => {
    setError(null);
    try {
      const order = slots.map((s, idx) => ({
        track_id: (s.track_id ?? s.id ?? (s as Record<string, unknown>).trackId) as unknown,
        position: idx,
      }));
      await adminFetch(secret, "/api/v1/admin/hero", { method: "PATCH", body: JSON.stringify({ order }) });
      await fetchHero();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[180px] space-y-1"><Label>Add track to hero (track_id)</Label><Input value={newTrackId} onChange={e => setNewTrackId(e.target.value)} placeholder="e.g. 123 or hashid" onKeyDown={e => e.key === "Enter" && handleAdd()} /></div>
        <Button onClick={handleAdd}>Add</Button>
        <Button variant="outline" onClick={fetchHero} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button>
        <Button variant="secondary" onClick={handleSaveOrder} disabled={slots.length === 0}>Save order (PATCH)</Button>
      </div>
      {error && <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">{error}</div>}
      <Card>
        <CardHeader><CardTitle className="text-base">Hero slots (featured_slots where slot_type=&lsquo;hero&rsquo;)</CardTitle><CardDescription>GET /api/v1/admin/hero — reorder via Up/Down or drag, then Save order. Position input also allowed.</CardDescription></CardHeader>
        <CardContent>
          {slots.length === 0 ? <p className="text-sm text-muted-foreground py-4">{loading ? "Loading…" : "No hero slots"}</p> : (
            <div className="space-y-2">
              {slots.map((s, idx) => {
                const tid = (s.track_id ?? s.id) as unknown;
                const title = String(s.title ?? `Track ${tid}`);
                const artist = String(s.artist ?? s.artistName ?? "");
                return (
                  <div
                    key={String(tid ?? idx)}
                    draggable
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => { if (dragIndex !== null && dragIndex !== idx) move(dragIndex, idx); setDragIndex(null); }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex items-center gap-2 p-3 rounded-lg border bg-card ${dragIndex === idx ? "opacity-50" : ""}`}
                  >
                    <span className="cursor-grab text-muted-foreground select-none" title="Drag to reorder">⋮⋮</span>
                    <Badge variant="outline" className="font-mono text-xs">#{idx}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{title}</div>
                      <div className="text-xs text-muted-foreground truncate">{artist} {tid ? `· ID ${String(tid)}` : ""}</div>
                    </div>
                    <Input
                      type="number"
                      className="w-16 h-7"
                      value={String(idx)}
                      readOnly
                      title="Position is index; use Up/Down then Save"
                    />
                    <div className="flex gap-1">
                      <Button size="icon-xs" variant="outline" onClick={() => move(idx, idx - 1)} disabled={idx === 0}>↑</Button>
                      <Button size="icon-xs" variant="outline" onClick={() => move(idx, idx + 1)} disabled={idx === slots.length - 1}>↓</Button>
                      <Button size="xs" variant="destructive" onClick={() => handleRemove(tid)}>Remove</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Backend reorder: PATCH /api/v1/admin/hero {"{order:[{track_id, position}]}"}. Drag reorders locally; click Save order to persist.</p>
    </div>
  );
}

// ---------- Ingest Tab ----------
type SpotifyTrack = { spotifyId: string; title: string; artist: string; album: string; coverUrl: string; duration: number };

function IngestTab({ secret }: { secret: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // upload via presign
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!q.trim()) return;
    setSearching(true); setError(null); setStatus(null);
    try {
      const data = await adminFetch(secret, `/api/v1/admin/spotify/search?q=${encodeURIComponent(q.trim())}`) as Record<string, unknown>;
      const tracks = (data as Record<string, unknown>).tracks;
      setResults(Array.isArray(tracks) ? tracks as SpotifyTrack[] : []);
      if (Array.isArray(tracks) && tracks.length === 0) setStatus("No results");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setSearching(false); }
  };

  const handleIngest = async (spotifyId: string) => {
    setIngestingId(spotifyId); setError(null); setStatus(null);
    try {
      // Try ingest endpoint (may not exist yet — backend may need implementation)
      const endpoints = ["/api/v1/admin/ingest", "/api/v1/ingest"];
      let lastErr: string | null = null;
      for (const ep of endpoints) {
        try {
          const data = await adminFetch(secret, ep, { method: "POST", body: JSON.stringify({ spotify_id: spotifyId, spotifyId }) });
          setStatus(`Ingested ${spotifyId}: ${JSON.stringify(data).slice(0, 500)}`);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e instanceof Error ? e.message : String(e);
          if (!lastErr.includes("404") && !lastErr.includes("not found")) { throw e; }
        }
      }
      if (lastErr) throw new Error(lastErr + " — ingest endpoint not found on backend; check backend routes");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setIngestingId(null); }
  };

  const handlePresignUpload = async () => {
    if (!file) { setUploadStatus("Pick a file first"); return; }
    setUploading(true); setUploadStatus(null); setError(null);
    try {
      // Backend expects POST /api/v1/upload with {filename, contentType}. Task spec says /api/v1/admin/upload/presign — try both.
      let presign: Record<string, unknown> | null = null;
      let lastErr: unknown = null;
      for (const ep of ["/api/v1/upload", "/api/v1/admin/upload/presign"]) {
        try {
          const d = await adminFetch(secret, ep, { method: "POST", body: JSON.stringify({ filename: file.name, contentType: file.type || "audio/mpeg" }) }) as Record<string, unknown>;
          presign = d;
          break;
        } catch (e) { lastErr = e; }
      }
      if (!presign) throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
      const uploadUrl = String((presign as Record<string, unknown>).uploadUrl ?? (presign as Record<string, unknown>).url ?? "");
      const key = String((presign as Record<string, unknown>).key ?? file.name);
      if (!uploadUrl) throw new Error("presign returned no uploadUrl");
      setUploadStatus(`Uploading to R2…`);
      const putRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      if (!putRes.ok) throw new Error(`R2 PUT failed: ${putRes.status} ${await putRes.text().then(t => t.slice(0, 300))}`);
      setUploadStatus(`Uploaded. key=${key}. Now ingest via POST /api/v1/admin/ingest with file_key (if backend supports it)…`);
      // Attempt ingest with file_key
      try {
        const ing = await adminFetch(secret, "/api/v1/admin/ingest", { method: "POST", body: JSON.stringify({ file_key: key, fileKey: key, filename: file.name }) });
        setUploadStatus(`Uploaded + ingested: ${JSON.stringify(ing).slice(0, 500)}`);
      } catch (e) {
        setUploadStatus(prev => `${prev} (ingest not auto — backend may need manual ingest: ${e instanceof Error ? e.message : String(e)})`);
      }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setUploadStatus(null); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Spotify Search → Ingest</CardTitle><CardDescription>GET /api/v1/admin/spotify/search?q= then POST /api/v1/admin/ingest {"{spotify_id}"}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search Spotify (e.g. Yo Maps well done)" onKeyDown={e => e.key === "Enter" && handleSearch()} />
            <Button onClick={handleSearch} disabled={searching || !q.trim()}>{searching ? "Searching…" : "Search"}</Button>
          </div>
          {error && <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">{error}</div>}
          {status && <div className="rounded-lg bg-muted px-3 py-2 text-sm">{status}</div>}
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map(r => (
                <div key={r.spotifyId} className="flex items-center gap-3 p-3 border rounded-lg">
                  {r.coverUrl ? <img src={r.coverUrl} alt="" className="w-12 h-12 rounded object-cover shrink-0" /> : <div className="w-12 h-12 rounded bg-muted shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.artist} · {r.album} · {Math.round(r.duration / 1000)}s</div>
                    <div className="text-xs font-mono text-muted-foreground truncate">{r.spotifyId}</div>
                  </div>
                  <Button size="sm" onClick={() => handleIngest(r.spotifyId)} disabled={ingestingId === r.spotifyId}>{ingestingId === r.spotifyId ? "Ingesting…" : "Ingest"}</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">File upload via presign → R2 → ingest</CardTitle><CardDescription>POST /api/v1/upload {"{filename, contentType}"} → PUT to R2 (uploadUrl) → POST /api/v1/admin/ingest {"{file_key}"}. Shows job status.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Audio file</Label>
            <Input type="file" accept="audio/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            {file && <p className="text-xs text-muted-foreground">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}</p>}
          </div>
          <Button onClick={handlePresignUpload} disabled={!file || uploading}>{uploading ? "Uploading…" : "Presign & Upload"}</Button>
          {uploadStatus && <div className="rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap break-words">{uploadStatus}</div>}
          <p className="text-xs text-muted-foreground">If ingest endpoint is not yet deployed, upload still succeeds (file lands in R2). Then ingest manually via backend or admin tracks create with audio_key.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Page ----------
export default function AdminPage() {
  const gate = useAdminSecret();
  const [tab, setTab] = useState("tracks");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-4">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">ZedBeatz Admin</h1>
          <span className="text-xs text-muted-foreground">Backend: {BACKEND} · header <code className="bg-muted px-1 py-0.5 rounded">x-admin-secret</code> · no Clerk · CORS allowed</span>
        </header>

        <Gate {...gate} />

        {!gate.secret ? (
          <p className="text-sm text-muted-foreground">Unlock to manage tracks, artists, albums, hero and ingest.</p>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full flex-wrap h-auto">
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="artists">Artists</TabsTrigger>
              <TabsTrigger value="albums">Albums</TabsTrigger>
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="ingest">Ingest</TabsTrigger>
            </TabsList>
            <Separator className="my-4" />
            <TabsContent value="tracks"><TracksTab secret={gate.secret} /></TabsContent>
            <TabsContent value="artists"><ArtistsTab secret={gate.secret} /></TabsContent>
            <TabsContent value="albums"><AlbumsTab secret={gate.secret} /></TabsContent>
            <TabsContent value="hero"><HeroTab secret={gate.secret} /></TabsContent>
            <TabsContent value="ingest"><IngestTab secret={gate.secret} /></TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
