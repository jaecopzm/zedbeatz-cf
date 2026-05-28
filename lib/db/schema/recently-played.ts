import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { tracks } from "./tracks";

export const recentlyPlayed = pgTable("recently_played", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").references(() => tracks.id),
  userId: varchar("user_id"),
  playedAt: timestamp("played_at"),
});

export type RecentlyPlayed = typeof recentlyPlayed.$inferSelect;
export type NewRecentlyPlayed = typeof recentlyPlayed.$inferInsert;
