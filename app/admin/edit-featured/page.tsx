"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function EditFeaturedPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/tracks?limit=100")
      .then(r => r.json())
      .then(data => {
        setTracks(Array.isArray(data) ? data : (data.tracks || []));
        setLoading(false);
      });
  }, []);

  async function saveFeatured(trackId: number, featured: string) {
    setSaving(trackId);
    try {
      await fetch(`/api/tracks/${trackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured_artists: featured })
      });
      alert("Saved!");
    } catch (err) {
      alert("Error saving");
    }
    setSaving(null);
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[var(--background)]">
      <h1 className="text-2xl font-bold mb-6">Add Featured Artists</h1>
      <div className="space-y-3">
        {tracks.map((track) => (
          <div key={track.id} className="bg-[var(--surface)] p-4 rounded-lg">
            <p className="font-bold text-sm md:text-base">{track.title}</p>
            <p className="text-xs md:text-sm text-[var(--muted)] mb-2">by {track.artist}</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Mampi, Chef 187"
                defaultValue={track.featuredArtists || ""}
                className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm"
                onBlur={(e) => {
                  if (e.target.value !== (track.featuredArtists || "")) {
                    saveFeatured(track.id, e.target.value);
                  }
                }}
              />
              <button
                disabled={saving === track.id}
                className="px-4 py-2 bg-[var(--primary)] text-black rounded text-sm font-bold disabled:opacity-50"
              >
                <Save size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
