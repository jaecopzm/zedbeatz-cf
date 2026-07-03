import { pgTable, serial, integer, varchar, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { artists } from "./artists";

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  artistId: integer("artist_id").references(() => artists.id),
  albumId: integer("album_id"),

  // CDN identifiers (new — replaces R2 audio storage)
  spotifyId: varchar("spotify_id", { length: 50 }),
  isrc: varchar("isrc", { length: 20 }),
  deezerId: varchar("deezer_id", { length: 30 }),

  // Cover image — direct URL (Spotify/Deezer CDN), replaces R2 coverKey
  coverUrl: text("cover_url"),

  // Legacy R2 keys — nullable, kept for existing tracks during migration
  audioKey: varchar("audio_key", { length: 255 }),
  coverKey: varchar("cover_key", { length: 255 }),

  duration: numeric("duration"),
  genre: varchar("genre", { length: 100 }),

  // Flexible tagging — e.g. ["zambian", "gospel", "banger", "2025"]
  tags: jsonb("tags").$type<string[]>().default([]),

  featuredArtists: text("featured_artists"),
  plays: integer("plays").default(0),
  slug: varchar("slug", { length: 255 }),
  lyrics: text("lyrics"),
  syncedLyrics: text("synced_lyrics"),

  // Content lifecycle: pending = staged, active = live, unlisted = hidden
  status: varchar("status", { length: 20 }).default("active"),

  createdAt: timestamp("created_at").defaultNow(),
});

export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;
