import { Router } from "express";
import { DeviceController } from "../controllers/device.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", auth(), DeviceController.registerDevice);

export default router;
