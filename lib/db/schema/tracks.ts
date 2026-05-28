import { pgTable, serial, integer, varchar, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { artists } from "./artists";

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  artistId: integer("artist_id").references(() => artists.id),
  albumId: integer("album_id"),
  audioKey: varchar("audio_key", { length: 255 }).notNull(),
  coverKey: varchar("cover_key", { length: 255 }),
  duration: numeric("duration"),
  genre: varchar("genre", { length: 100 }),
  featuredArtists: text("featured_artists"),
  plays: integer("plays").default(0),
  slug: varchar("slug", { length: 255 }),
  lyrics: text("lyrics"),
  syncedLyrics: text("synced_lyrics"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;
