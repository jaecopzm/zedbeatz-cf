/**
 * Generate URL-friendly slugs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-\d+$/g, ''); // Remove trailing numbers like -187, -7
}

/**
 * Generate track slug: artist-name-song-title
 */
export function generateTrackSlug(artist: string, title: string): string {
  const artistSlug = slugify(artist);
  const titleSlug = slugify(title);
  return `${artistSlug}-${titleSlug}`;
}

/**
 * Generate artist slug: artist-name
 */
export function generateArtistSlug(name: string): string {
  return slugify(name);
}

/**
 * Generate album slug: artist-name-album-title
 */
export function generateAlbumSlug(artist: string, album: string): string {
  const artistSlug = slugify(artist);
  const albumSlug = slugify(album);
  return `${artistSlug}-${albumSlug}`;
}
