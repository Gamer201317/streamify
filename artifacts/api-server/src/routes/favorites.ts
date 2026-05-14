import { Router, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, favoritesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

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

// GET /api/favorites
router.get("/favorites", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  try {
    const favs = await db
      .select({ videoId: favoritesTable.videoId })
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));
    res.json(favs.map((f) => f.videoId));
  } catch (err) {
    req.log.error({ err }, "Failed to list favorites");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/favorites/:videoId
router.post("/favorites/:videoId", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  try {
    const videoId = String(req.params.videoId);
    await db
      .insert(favoritesTable)
      .values({ userId, videoId })
      .onConflictDoNothing();
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to add favorite");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/favorites/:videoId
router.delete("/favorites/:videoId", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  try {
    await db
      .delete(favoritesTable)
      .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.videoId, String(req.params.videoId))));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to remove favorite");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
