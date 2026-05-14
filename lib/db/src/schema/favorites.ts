import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const favoritesTable = pgTable("favorites", {
  userId: text("user_id").notNull(),
  videoId: text("video_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.videoId] }),
}));

export type Favorite = typeof favoritesTable.$inferSelect;
