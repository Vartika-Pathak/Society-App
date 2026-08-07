import { Router, type IRouter } from "express";
import healthRouter from "./health";
import membersRouter from "./members";
import eventsRouter from "./events";
import residentMeetingsRouter from "./residentMeetings";
import newsRouter from "./news";
import galleryRouter from "./gallery";
import joinRequestsRouter from "./joinRequests";
import contactRouter from "./contact";
import statsRouter from "./stats";
import authRouter from "./auth";
import visitsRouter from "./visits";
import maintenanceRouter from "./maintenance";
import complaintsRouter from "./complaints";
import emergencyRouter from "./emergency";
import amenitiesRouter from "./amenities";

const router: IRouter = Router();

router.use(healthRouter);
router.use(membersRouter);
router.use(eventsRouter);
router.use(residentMeetingsRouter);
router.use(newsRouter);
router.use(galleryRouter);
router.use(joinRequestsRouter);
router.use(contactRouter);
router.use(statsRouter);
router.use(authRouter);
router.use(visitsRouter);
router.use(maintenanceRouter);
router.use(complaintsRouter);
router.use(emergencyRouter);
router.use(amenitiesRouter);

export default router;
