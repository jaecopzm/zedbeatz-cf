import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  bio: text("bio"),

  // Direct image URL (Spotify/Deezer), replaces R2 imageKey
  imageUrl: text("image_url"),
  spotifyId: varchar("spotify_id", { length: 50 }),
  deezerId: varchar("deezer_id", { length: 30 }),

  // Useful for filtering local vs international, and Zed artist pages
  country: varchar("country", { length: 5 }).default("ZM"),
  genre: varchar("genre", { length: 100 }),

  // Legacy R2 key — nullable, kept during migration
  imageKey: varchar("image_key", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow(),
});

export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
