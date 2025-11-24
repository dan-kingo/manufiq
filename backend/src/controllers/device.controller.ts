import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service.js";

export class DeviceController {
  static async registerDevice(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { token, platform, deviceId } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      if (!platform || !["ios", "android", "web"].includes(platform)) {
        return res.status(400).json({ error: "Valid platform (ios|android|web) is required" });
      }

      await NotificationService.registerDeviceToken(
        userId!,
        token,
        platform,
        deviceId
      );

      return res.json({
        message: "Device registered successfully"
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message || "Failed to register device" });
    }
  }
}
