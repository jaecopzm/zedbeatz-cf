import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { playlists } from "./playlists";
import { tracks } from "./tracks";

export const playlistTracks = pgTable("playlist_tracks", {
  playlistId: integer("playlist_id").notNull().references(() => playlists.id),
  trackId: integer("track_id").notNull().references(() => tracks.id),
  position: integer("position"),
}, (table) => ({
  pk: primaryKey({ columns: [table.playlistId, table.trackId] }),
}));

export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type NewPlaylistTrack = typeof playlistTracks.$inferInsert;
