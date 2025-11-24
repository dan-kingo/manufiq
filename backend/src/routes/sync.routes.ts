import { Router } from "express";
import { SyncController } from "../controllers/sync.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/push", auth(), SyncController.push);
router.get("/pull", auth(), SyncController.pull);
router.get("/conflicts", auth(), SyncController.conflicts);
router.post("/deduplicate", auth(), SyncController.deduplicate);
router.post("/cleanup", auth(), SyncController.cleanup);
router.get("/status", auth(), SyncController.status);

export default router;
