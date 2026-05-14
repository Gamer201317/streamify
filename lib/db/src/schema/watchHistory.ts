import { pgTable, text, real, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const watchHistoryTable = pgTable("watch_history", {
  userId: text("user_id").notNull(),
  videoId: text("video_id").notNull(),
  progress: real("progress").notNull().default(0),
  lastWatchedAt: timestamp("last_watched_at").notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.videoId] }),
}));

export type WatchHistory = typeof watchHistoryTable.$inferSelect;
