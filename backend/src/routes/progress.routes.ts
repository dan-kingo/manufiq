import { Router } from "express";
import { ProgressController } from "../controllers/progress.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:orderId/steps", auth(), ProgressController.addProductionSteps.bind(ProgressController));
router.get("/:orderId/steps", auth(), ProgressController.getProductionSteps.bind(ProgressController));
router.put("/steps/:stepId", auth(), ProgressController.updateProductionStep.bind(ProgressController));
router.delete("/steps/:stepId", auth(), ProgressController.deleteProductionStep.bind(ProgressController));
router.post("/:orderId/deliver", auth(), ProgressController.markOrderDelivered.bind(ProgressController));
router.get("/:orderId/receipt", auth(), ProgressController.getReceipt.bind(ProgressController));
router.get("/receipts", auth(), ProgressController.listReceipts.bind(ProgressController));

export default router;
