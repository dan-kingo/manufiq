import { Router } from "express";
import { OrderController } from "../controllers/order.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", auth(), requireRole("owner"), OrderController.createOrder);
router.get("/", auth(), OrderController.listOrders);
router.get("/stats", auth(), OrderController.getOrderStats);
router.get("/:id", auth(), OrderController.getOrder);
router.put("/:id", auth(), requireRole("owner"), OrderController.updateOrder);
router.put("/:id/status", auth(), OrderController.updateOrderStatus);
router.put("/:id/assign", auth(), requireRole("owner"), OrderController.assignStaff);
router.post("/:id/cancel", auth(), requireRole("owner"), OrderController.cancelOrder);
router.get("/:id/history", auth(), OrderController.getOrderHistory);

export default router;
