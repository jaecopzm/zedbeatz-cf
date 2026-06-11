"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Check, ListPlus, X } from "lucide-react";
import { showToast } from "@/components/toast";
import { useUser, SignInButton } from "@clerk/nextjs";

type Playlist = { id: number; name: string };

export default function AddToPlaylist({ trackId }: { trackId: number }) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [added, setAdded] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (open) {
      fetch("/api/playlists?type=user")
        .then(r => r.json())
        .then(d => {
          const next = Array.isArray(d) ? d : [];
          setPlaylists(next.filter((playlist) => playlist.name !== "Favourites"));
        });
    }
  }, [open]);

  // close desktop dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // lock body scroll when sheet is open on mobile
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function add(playlistId: number) {
    const res = await fetch(`/api/playlists/${playlistId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track_id: trackId }),
    });
    const data = await res.json();
    if (data.duplicate) { showToast("Already in playlist", "info"); return; }
    setAdded(playlistId);
    showToast(`Added to ${playlists.find(p => p.id === playlistId)?.name || "playlist"}`, "success");
    setTimeout(() => { setAdded(null); setOpen(false); }, 800);
  }

  if (!isSignedIn) return (
    <SignInButton mode="modal">
      <button className="w-6 h-6 rounded-full bg-background/60 flex items-center justify-center text-foreground hover:bg-[var(--primary)] hover:text-black transition-colors">
        <Plus size={13} />
      </button>
    </SignInButton>
  );

  return (
    <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-6 h-6 rounded-full bg-background/60 flex items-center justify-center text-foreground hover:bg-[var(--primary)] hover:text-black transition-colors"
      >
        <Plus size={13} />
      </button>

      {open && (
        <>
          {/* ── Mobile bottom sheet ── */}
          <div className="sm:hidden fixed inset-0 z-[200]" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <div
              className="absolute bottom-0 left-0 right-0 bg-[var(--surface)] rounded-t-2xl pb-safe"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--surface-2)]" />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h3 className="font-semibold text-sm">Add to playlist</h3>
                <button onClick={() => setOpen(false)} className="p-1 text-[var(--muted)]">
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-72 py-2">
                {playlists.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] px-4 py-4 text-center">No playlists yet</p>
                ) : playlists.map(p => (
                  <button
                    key={p.id}
                    onClick={() => add(p.id)}
                    className="w-full text-left px-4 py-3.5 text-sm flex items-center gap-3 active:bg-[var(--surface-2)] transition-colors"
                  >
                    {added === p.id
                      ? <Check size={16} className="text-[var(--primary)] shrink-0" />
                      : <ListPlus size={16} className="text-[var(--muted)] shrink-0" />}
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
              {/* safe area spacer */}
              <div className="h-6" />
            </div>
          </div>

          {/* ── Desktop dropdown (unchanged) ── */}
          <div className="hidden sm:block absolute bottom-8 right-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl min-w-44 z-50 py-1 overflow-hidden">
            {playlists.length === 0 ? (
              <p className="text-xs text-[var(--muted)] px-3 py-2">No playlists yet</p>
            ) : playlists.map(p => (
              <button key={p.id} onClick={() => add(p.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-2)] flex items-center gap-2 transition-colors">
                {added === p.id ? <Check size={12} className="text-[var(--primary)] shrink-0" /> : <ListPlus size={12} className="text-[var(--muted)] shrink-0" />}
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
