import { Router, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, watchHistoryTable, type WatchHistory } from "@workspace/db";
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

function toApiEntry(entry: WatchHistory) {
  return {
    videoId: entry.videoId,
    progress: entry.progress,
    lastWatchedAt: entry.lastWatchedAt instanceof Date ? entry.lastWatchedAt.toISOString() : entry.lastWatchedAt,
  };
}

// GET /api/watch-history
router.get("/watch-history", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  try {
    const history = await db
      .select()
      .from(watchHistoryTable)
      .where(eq(watchHistoryTable.userId, userId))
      .orderBy(desc(watchHistoryTable.lastWatchedAt));
    res.json(history.map(toApiEntry));
  } catch (err) {
    req.log.error({ err }, "Failed to list watch history");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/watch-history/:videoId
router.put("/watch-history/:videoId", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  try {
    const { progress, lastWatchedAt } = req.body as { progress: number; lastWatchedAt?: string };
    const videoId = String(req.params.videoId);
    const [entry] = await db
      .insert(watchHistoryTable)
      .values({
        userId,
        videoId,
        progress,
        lastWatchedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date(),
      })
      .onConflictDoUpdate({
        target: [watchHistoryTable.userId, watchHistoryTable.videoId],
        set: {
          progress,
          lastWatchedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date(),
        },
      })
      .returning();
    res.json(toApiEntry(entry));
  } catch (err) {
    req.log.error({ err }, "Failed to upsert watch history");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
