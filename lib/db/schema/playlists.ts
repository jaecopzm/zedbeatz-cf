import { pgTable, serial, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: varchar("user_id"),

  // Direct URL, replaces R2 coverKey
  coverUrl: text("cover_url"),

  isFeatured: boolean("is_featured").default(false),
  category: varchar("category"),
  description: text("description"),

  // Legacy R2 key — nullable, kept during migration
  coverKey: text("cover_key"),

  createdAt: timestamp("created_at").defaultNow(),
});

export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;
