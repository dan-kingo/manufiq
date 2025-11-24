import { Router } from "express";
import { MaterialController } from "../controllers/material.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { upload } from "../services/cloudinary.service.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", auth(), requireRole("owner"), upload.single("image"),  MaterialController.createMaterial);
router.get("/", auth(), MaterialController.listMaterials);
router.get("/:id", auth(), MaterialController.getMaterial);
router.put("/:id", auth(), requireRole("owner"), upload.single("image"),MaterialController.updateMaterial);
router.post("/:id/adjust", auth(), MaterialController.adjustQuantity);
router.get("/:id/events", auth(), MaterialController.getMaterialEvents);

export default router;
