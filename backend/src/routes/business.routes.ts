import { Router } from "express";
import { BusinessController } from "../controllers/business.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { upload } from "../services/cloudinary.service.js";

const router = Router();

router.get("/:id", BusinessController.getBusiness);
router.put("/:id", auth(), BusinessController.updateBusiness);
router.post(
  "/:id/doc",
  auth(),
  upload.single("document"),
  BusinessController.uploadDocument
);
router.get("/:id/settings", auth(), BusinessController.getSettings);

export default router;
