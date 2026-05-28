import { pgTable, serial, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  coverKey: text("cover_key"),
  userId: varchar("user_id"),
  isFeatured: boolean("is_featured").default(false),
  category: varchar("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;
