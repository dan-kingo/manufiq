import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service.js";

export class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit, includeRead } = req.query;

      const notifications = await NotificationService.getUserNotifications(
        userId!,
        limit ? parseInt(limit as string, 10) : 50,
        includeRead === "true"
      );

      const unreadCount = await NotificationService.getUnreadCount(userId!);

      return res.json({
        notifications,
        unreadCount
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const notification = await NotificationService.markAsRead(id as any, userId!);

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      return res.json({
        message: "Notification marked as read",
        notification
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to mark notification as read" });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const count = await NotificationService.markAllAsRead(userId!);

      return res.json({
        message: "All notifications marked as read",
        count
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  }

  static async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const deleted = await NotificationService.deleteNotification(id as any, userId!);

      if (!deleted) {
        return res.status(404).json({ error: "Notification not found" });
      }

      return res.json({
        message: "Notification deleted"
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete notification" });
    }
  }

  static async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const count = await NotificationService.getUnreadCount(userId!);

      return res.json({ count });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to get unread count" });
    }
  }
}
