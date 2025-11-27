import express from "express";
import { AlertController } from "../controllers/alert.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", auth(), AlertController.getAlerts);
router.put("/:id/resolve", auth(), AlertController.resolveAlert);
router.post("/check", auth(), AlertController.triggerThresholdCheck);

export default router;
