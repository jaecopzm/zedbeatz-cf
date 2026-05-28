import { pgTable, serial, integer, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { artists } from "./artists";

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  coverKey: varchar("cover_key", { length: 255 }),
  releaseYear: integer("release_year"),
  artistId: integer("artist_id").references(() => artists.id),
  slug: varchar("slug", { length: 255 }),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;
