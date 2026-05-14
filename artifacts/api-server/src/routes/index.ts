import { Router, type IRouter } from "express";
import healthRouter from "./health";
import videosRouter from "./videos";
import favoritesRouter from "./favorites";
import watchHistoryRouter from "./watchHistory";
import storageRouter from "./storage";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(videosRouter);
router.use(favoritesRouter);
router.use(watchHistoryRouter);
router.use(storageRouter);
router.use(searchRouter);

export default router;
