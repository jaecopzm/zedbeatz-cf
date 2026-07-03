import { pgTable, serial, integer, varchar, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { tracks } from "./tracks";

/**
 * featured_slots — central content curation table.
 *
 * Replaces the scattered hero_tracks table, is_featured booleans on albums/playlists,
 * and the hardcoded "trending" / "new-releases" queries.
 *
 * Slot types:
 *   hero          — hero banner carousel (was hero_tracks)
 *   trending      — "Trending Now" section
 *   new_release   — "New Releases" section
 *   editor_pick   — "Editor's Picks" curated row
 *   spotlight     — single featured artist/album spotlight
 *   gospel        — genre-specific curated row
 *   hits          — "Greatest Hits" row
 *   (any string)  — you can add new slot types without a schema change
 *
 * Usage in admin: drag-and-drop rows per slot type to reorder.
 * Usage in frontend: query by slot_type, order by position.
 */
export const featuredSlots = pgTable("featured_slots", {
  id: serial("id").primaryKey(),

  // Which curated section this belongs to
  slotType: varchar("slot_type", { length: 50 }).notNull(),

  // The track being featured (nullable — future: could point to album/artist too)
  trackId: integer("track_id").references(() => tracks.id, { onDelete: "cascade" }),

  // Display order within the slot type (lower = first)
  position: integer("position").notNull().default(0),

  // Soft toggle — keep the row but hide it without deleting
  isActive: boolean("is_active").default(true),

  // Optional label override shown on frontend e.g. "🔥 Fire Track"
  label: varchar("label", { length: 100 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Only one track per slot type at a given position
  uniqueSlotPosition: unique().on(table.slotType, table.position),
}));

export type FeaturedSlot = typeof featuredSlots.$inferSelect;
export type NewFeaturedSlot = typeof featuredSlots.$inferInsert;
