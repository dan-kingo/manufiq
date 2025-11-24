import { Router } from "express";
import { ProgressController } from "../controllers/progress.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:orderId/steps", auth(), ProgressController.addProductionSteps);
router.get("/:orderId/steps", auth(), ProgressController.getProductionSteps);
router.put("/steps/:stepId", auth(), ProgressController.updateProductionStep);
router.delete("/steps/:stepId", auth(), ProgressController.deleteProductionStep);
router.post("/:orderId/deliver", auth(), ProgressController.markOrderDelivered);
router.get("/:orderId/receipt", auth(), ProgressController.getReceipt);
router.get("/receipts", auth(), ProgressController.listReceipts);

export default router;
