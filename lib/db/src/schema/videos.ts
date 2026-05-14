import { pgTable, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const videosTable = pgTable("videos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  genre: text("genre"),
  year: integer("year"),
  rating: real("rating"),
  seasons: integer("seasons"),
  episodes: integer("episodes"),
  description: text("description"),
  tags: jsonb("tags").$type<string[]>(),
  fileSize: text("file_size"),
  videoUrl: text("video_url"),
  posterUrl: text("poster_url"),
  tmdbId: integer("tmdb_id"),
  status: text("status").notNull().default("processing"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVideoSchema = createInsertSchema(videosTable).omit({ id: true, createdAt: true });
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videosTable.$inferSelect;
