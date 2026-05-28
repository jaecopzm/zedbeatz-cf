import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { artists } from "./artists";

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  artistId: integer("artist_id").notNull().references(() => artists.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;
