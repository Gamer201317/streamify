import { Router, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, videosTable, type Video } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

interface AuthedRequest extends Request {
  userId: string;
}

const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthedRequest).userId = userId;
  next();
};

function toApiVideo(v: Video) {
  return {
    id: v.id,
    userId: v.userId,
    title: v.title,
    type: v.type,
    genre: v.genre,
    year: v.year,
    rating: v.rating,
    seasons: v.seasons,
    episodes: v.episodes,
    description: v.description,
    tags: v.tags,
    fileSize: v.fileSize,
    videoUrl: v.videoUrl,
    posterUrl: v.posterUrl,
    tmdbId: v.tmdbId,
    status: v.status,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
  };
}

// GET /api/videos
router.get("/videos", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  try {
    const videos = await db
      .select()
      .from(videosTable)
      .where(eq(videosTable.userId, userId))
      .orderBy(desc(videosTable.createdAt));
    res.json(videos.map(toApiVideo));
  } catch (err) {
    req.log.error({ err }, "Failed to list videos");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/videos
router.post("/videos", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  try {
    const { title, type, genre, year, rating, seasons, episodes, description, tags, fileSize, videoUrl, posterUrl, tmdbId, status } = req.body as {
      title: string;
      type: string;
      genre?: string | null;
      year?: number | null;
      rating?: number | null;
      seasons?: number | null;
      episodes?: number | null;
      description?: string | null;
      tags?: string[] | null;
      fileSize?: string | null;
      videoUrl?: string | null;
      posterUrl?: string | null;
      tmdbId?: number | null;
      status?: string;
    };
    const [video] = await db
      .insert(videosTable)
      .values({
        userId,
        title,
        type,
        genre: genre ?? null,
        year: year ?? null,
        rating: rating ?? null,
        seasons: seasons ?? null,
        episodes: episodes ?? null,
        description: description ?? null,
        tags: tags ?? null,
        fileSize: fileSize ?? null,
        videoUrl: videoUrl ?? null,
        posterUrl: posterUrl ?? null,
        tmdbId: tmdbId ?? null,
        status: status ?? "processing",
      })
      .returning();
    res.status(201).json(toApiVideo(video));
  } catch (err) {
    req.log.error({ err }, "Failed to create video");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/videos/:id
router.get("/videos/:id", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  try {
    const id = String(req.params.id);
    const [video] = await db
      .select()
      .from(videosTable)
      .where(and(eq(videosTable.id, id), eq(videosTable.userId, userId)));
    if (!video) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(toApiVideo(video));
  } catch (err) {
    req.log.error({ err }, "Failed to get video");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/videos/:id
router.patch("/videos/:id", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  try {
    const { title, status, genre, year, rating } = req.body as {
      title?: string;
      status?: string;
      genre?: string;
      year?: number;
      rating?: number;
    };
    const updateData: Partial<Pick<Video, "title" | "status" | "genre" | "year" | "rating">> = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (genre !== undefined) updateData.genre = genre;
    if (year !== undefined) updateData.year = year;
    if (rating !== undefined) updateData.rating = rating;

    const id = String(req.params.id);
    const [video] = await db
      .update(videosTable)
      .set(updateData)
      .where(and(eq(videosTable.id, id), eq(videosTable.userId, userId)))
      .returning();
    if (!video) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(toApiVideo(video));
  } catch (err) {
    req.log.error({ err }, "Failed to update video");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/videos/:id
router.delete("/videos/:id", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  try {
    const id = String(req.params.id);
    const deleted = await db
      .delete(videosTable)
      .where(and(eq(videosTable.id, id), eq(videosTable.userId, userId)))
      .returning();
    if (!deleted.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete video");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
