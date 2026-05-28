import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  bio: text("bio"),
  imageKey: varchar("image_key", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
