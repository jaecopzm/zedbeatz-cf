import { pgTable, serial, integer, varchar, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { artists } from "./artists";

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  artistId: integer("artist_id").references(() => artists.id),
  slug: varchar("slug", { length: 255 }),

  // album | ep | single | compilation
  albumType: varchar("album_type", { length: 20 }).default("album"),

  releaseYear: integer("release_year"),
  releaseDate: varchar("release_date", { length: 10 }), // YYYY-MM-DD for precision

  spotifyId: varchar("spotify_id", { length: 50 }),
  deezerId: varchar("deezer_id", { length: 30 }),

  // Direct URL, replaces R2 coverKey
  coverUrl: text("cover_url"),

  isFeatured: boolean("is_featured").default(false),

  // Legacy R2 key — nullable, kept during migration
  coverKey: varchar("cover_key", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow(),
});

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;
