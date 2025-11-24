import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", auth(), NotificationController.getNotifications);
router.get("/unread-count", auth(), NotificationController.getUnreadCount);
router.put("/:id/read", auth(), NotificationController.markAsRead);
router.put("/read-all", auth(), NotificationController.markAllAsRead);
router.delete("/:id", auth(), NotificationController.deleteNotification);

export default router;
