/**
 * cdn.ts — Central URL resolver for ZedBeatz
 *
 * Priority for audio:
 *   1. R2 audioKey  (all new uploads go here — stable, our own storage)
 *   2. Music CDN via ISRC (legacy tracks uploaded before R2 migration)
 *   3. null — track is not playable
 *
 * Priority for images (covers / artist photos):
 *   1. Direct URL (coverUrl / imageUrl — from Spotify or Deezer CDN)
 *   2. R2 (legacy coverKey / imageKey)
 *   3. null
 */

// Fallback CDN for legacy tracks that only have ISRC (no audioKey)
const MUSIC_CDN = "https://cdn-spotify-247.zm.io.vn/download";

// Our R2 public CDN — primary audio source for all new uploads
const R2_CDN = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://cdn.zedbeatz.com";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AudioSource =
  | { type: "cdn_isrc";    url: string; isrc: string }
  | { type: "cdn_deezer";  url: string; deezerId: string }
  | { type: "cdn_spotify"; url: string; spotifyId: string }
  | { type: "r2";          url: string; key: string }
  | { type: "none" };

export type TrackIdentifiers = {
  isrc?:      string | null;
  deezerId?:  string | null;
  spotifyId?: string | null;
  audioKey?:  string | null;
};

// ─── Audio URL resolution ──────────────────────────────────────────────────────

/**
 * Returns the best available audio URL for a track, with its source type.
 * Use this in the player so you know what you're playing.
 */
export function resolveAudioSource(track: TrackIdentifiers): AudioSource {
  // R2 first — all new pipeline uploads land here
  if (track.audioKey?.trim()) {
    const key = track.audioKey.trim();
    return {
      type: "r2",
      url: `${R2_CDN}/${key}`,
      key,
    };
  }

  // Fallback: legacy tracks that were never uploaded to R2 but have an ISRC
  if (track.isrc?.trim()) {
    const isrc = track.isrc.trim().toUpperCase();
    return {
      type: "cdn_isrc",
      url: `${MUSIC_CDN}/isrc/${encodeURIComponent(isrc)}`,
      isrc,
    };
  }

  return { type: "none" };
}

/**
 * Returns just the audio URL string, or null if unresolvable.
 * Convenient for places that just need the URL.
 */
export function getAudioUrl(track: TrackIdentifiers): string | null {
  const source = resolveAudioSource(track);
  return source.type === "none" ? null : source.url;
}

/**
 * Returns true if this track can be played at all.
 */
export function isPlayable(track: TrackIdentifiers): boolean {
  return resolveAudioSource(track).type !== "none";
}

// ─── Image URL resolution ─────────────────────────────────────────────────────

type ImageIdentifiers = {
  coverUrl?:  string | null;
  coverKey?:  string | null;
  imageUrl?:  string | null;  // artists
  imageKey?:  string | null;  // artists legacy
};

/**
 * Returns the best available image URL for a track, album, artist, or playlist.
 * Pass whichever fields your entity has.
 */
export function getCoverUrl(entity: ImageIdentifiers): string | null {
  const direct = entity.coverUrl ?? entity.imageUrl;
  if (direct?.trim()) return direct.trim();

  const key = entity.coverKey ?? entity.imageKey;
  if (key?.trim()) return `${R2_CDN}/${key.trim()}`;

  return null;
}

// ─── Legacy compatibility ─────────────────────────────────────────────────────

/**
 * Drop-in replacement for the old `getPublicUrl(key)` from lib/r2.ts.
 * Use this during the migration period where some code still calls getPublicUrl.
 * Once all callers are updated, delete this.
 *
 * @deprecated Use getAudioUrl() or getCoverUrl() instead.
 */
export function getPublicUrl(key: string): string {
  return `${R2_CDN}/${key}`;
}
