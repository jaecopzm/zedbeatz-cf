import { pgTable, bigserial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { tracks } from "./tracks";

export const comments = pgTable("comments", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  trackId: integer("track_id").notNull().references(() => tracks.id),
  userId: varchar("user_id").notNull(),
  userName: varchar("user_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
