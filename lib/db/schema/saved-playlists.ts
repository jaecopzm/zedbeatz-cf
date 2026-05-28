import { pgTable, varchar, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { playlists } from "./playlists";

export const savedPlaylists = pgTable("saved_playlists", {
  userId: varchar("user_id").notNull(),
  playlistId: integer("playlist_id").notNull().references(() => playlists.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.playlistId] }),
}));

export type SavedPlaylist = typeof savedPlaylists.$inferSelect;
export type NewSavedPlaylist = typeof savedPlaylists.$inferInsert;
