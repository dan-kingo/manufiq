import { Request, Response } from "express";
import { User } from "../models/User.js";
import { SyncService } from "../services/sync.service.js";

export class SyncController {
  static async push(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { operations } = req.body;

      if (!Array.isArray(operations) || operations.length === 0) {
        return res.status(400).json({ error: "Operations array is required" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const results = await SyncService.applyOperations(
        operations,
        user.businessId,
        user._id
      );

      const serverTime = new Date();

      return res.json({
        serverTime,
        results,
        message: `Processed ${results.length} operations`
      });
    } catch (err) {
      console.error("Sync push error:", err);
      return res.status(500).json({ error: "Failed to process sync operations" });
    }
  }

  static async pull(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { since } = req.query;

      if (!since) {
        return res.status(400).json({ error: "since parameter is required (ISO timestamp)" });
      }

      const sinceDate = new Date(since as string);

      if (isNaN(sinceDate.getTime())) {
        return res.status(400).json({ error: "Invalid timestamp format" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const operations = await SyncService.getOperationsSince(
        user.businessId,
        sinceDate
      );

      const serverTime = new Date();

      return res.json({
        serverTime,
        operations,
        count: operations.length
      });
    } catch (err) {
      console.error("Sync pull error:", err);
      return res.status(500).json({ error: "Failed to fetch sync operations" });
    }
  }

  static async conflicts(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const conflictLimit = limit ? parseInt(limit as string, 10) : 100;

      const conflicts = await SyncService.getConflictLog(
        user.businessId,
        conflictLimit
      );

      return res.json({
        conflicts,
        count: conflicts.length
      });
    } catch (err) {
      console.error("Conflicts fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch conflicts" });
    }
  }

  static async deduplicate(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      if (user.role !== "owner" && user.role !== "admin") {
        return res.status(403).json({ error: "Only owners and admins can deduplicate" });
      }

      const removedCount = await SyncService.deduplicateOperations(user.businessId);

      return res.json({
        message: "Deduplication completed",
        removedCount
      });
    } catch (err) {
      console.error("Deduplication error:", err);
      return res.status(500).json({ error: "Failed to deduplicate operations" });
    }
  }

  static async cleanup(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { days } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      if (user.role !== "owner" && user.role !== "admin") {
        return res.status(403).json({ error: "Only owners and admins can cleanup" });
      }

      const daysToKeep = days ? parseInt(days as string, 10) : 30;

      const removedCount = await SyncService.cleanupOldOperations(daysToKeep);

      return res.json({
        message: `Cleaned up operations older than ${daysToKeep} days`,
        removedCount
      });
    } catch (err) {
      console.error("Cleanup error:", err);
      return res.status(500).json({ error: "Failed to cleanup operations" });
    }
  }

  static async status(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const serverTime = new Date();

      return res.json({
        serverTime,
        businessId: user.businessId,
        userId: user._id,
        message: "Sync service is operational"
      });
    } catch (err) {
      console.error("Status check error:", err);
      return res.status(500).json({ error: "Failed to check status" });
    }
  }
}
