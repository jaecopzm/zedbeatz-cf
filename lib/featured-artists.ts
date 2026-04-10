/**
 * Sanitize a featured_artists DB value — returns undefined for falsy strings like "false", "null", ""
 */
export function sanitizeFeaturedArtists(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "false" || trimmed === "null") return undefined;
  return trimmed;
}

/**
 * Parse featured artists string and return array of artist names
 * Handles formats like: "Artist1, Artist2", "Artist1 & Artist2", "Artist1 feat. Artist2"
 */
export function parseFeaturedArtists(featuredArtists: string): string[] {
  return featuredArtists
    .split(/[,&]|feat\.|ft\./)
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

/**
 * Generate artist slug from name for linking
 */
export function getArtistSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-\d+$/g, '');
}
