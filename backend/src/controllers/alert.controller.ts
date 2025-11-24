import { Request, Response } from "express";
import { User } from "../models/User.js";
import { AlertService } from "../services/alert.service.js";

export class AlertController {
  static async getAlerts(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { includeResolved } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const alerts = await AlertService.getBusinessAlerts(
        user.businessId,
        includeResolved === "true"
      );

      return res.json({ alerts });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch alerts" });
    }
  }

  static async resolveAlert(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      if (user.role !== "owner" && user.role !== "admin") {
        return res.status(403).json({ error: "Only owners and admins can resolve alerts" });
      }

      const alert = await AlertService.resolveAlert(id as any);

      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      return res.json({
        message: "Alert resolved",
        alert
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to resolve alert" });
    }
  }

  static async triggerThresholdCheck(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      if (user.role !== "owner" && user.role !== "admin") {
        return res.status(403).json({ error: "Only owners and admins can trigger checks" });
      }

      await AlertService.checkAllThresholds();
      await AlertService.checkExpiringMaterials();

      return res.json({
        message: "Threshold check triggered successfully"
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to trigger threshold check" });
    }
  }
}
