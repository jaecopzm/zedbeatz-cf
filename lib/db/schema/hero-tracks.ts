import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { tracks } from "./tracks";

export const heroTracks = pgTable("hero_tracks", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").notNull().references(() => tracks.id),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueTrackId: unique().on(table.trackId),
}));

export type HeroTrack = typeof heroTracks.$inferSelect;
export type NewHeroTrack = typeof heroTracks.$inferInsert;
