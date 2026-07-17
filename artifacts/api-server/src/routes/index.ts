import { Router, type IRouter } from "express";
import healthRouter from "./health";
import membersRouter from "./members";
import eventsRouter from "./events";
import newsRouter from "./news";
import galleryRouter from "./gallery";
import joinRequestsRouter from "./joinRequests";
import contactRouter from "./contact";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(membersRouter);
router.use(eventsRouter);
router.use(newsRouter);
router.use(galleryRouter);
router.use(joinRequestsRouter);
router.use(contactRouter);
router.use(statsRouter);

export default router;
