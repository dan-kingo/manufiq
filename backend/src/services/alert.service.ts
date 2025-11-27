import mongoose from "mongoose";
import { Alert, IAlert } from "../models/Alert.js";
import { Material } from "../models/Material.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { NotificationService } from "./notification.service.js";

export class AlertService {
  static async checkMaterialThreshold(
    materialId: mongoose.Types.ObjectId,
    businessId: mongoose.Types.ObjectId,
    currentQuantity: number
  ): Promise<void> {
    const material = await Material.findById(materialId);

    if (!material) return;

  const threshold = material.minThreshold ?? 0;
  const isLowStock = currentQuantity <= threshold;
  const isOutOfStock = currentQuantity === 0;

    const existingAlert = await Alert.findOne({
      materialId,
      businessId,
      isResolved: false
    });

    if (isOutOfStock) {
      if (existingAlert && existingAlert.type !== "out_of_stock") {
        existingAlert.type = "out_of_stock";
        existingAlert.severity = "critical";
        existingAlert.message = `${material.name} is out of stock`;
        existingAlert.currentQuantity = currentQuantity;
        await existingAlert.save();
      } else if (!existingAlert) {
        const alert = await this.createAlert(
          businessId,
          materialId,
          "out_of_stock",
          "critical",
          `${material.name} is out of stock`,
          currentQuantity,
          threshold
        );

        await this.sendAlertNotifications(alert);
      }
    } else if (isLowStock) {
      if (!existingAlert) {
        const alert = await this.createAlert(
          businessId,
          materialId,
          "low_stock",
          "warning",
          `${material.name} is running low (${currentQuantity} ${material.unit} remaining)`,
          currentQuantity,
          threshold
        );

        await this.sendAlertNotifications(alert);
      }
    } else {
      if (existingAlert) {
        existingAlert.isResolved = true;
        existingAlert.resolvedAt = new Date();
        await existingAlert.save();
      }
    }
  }

  static async createAlert(
    businessId: mongoose.Types.ObjectId,
    materialId: mongoose.Types.ObjectId,
    type: "low_stock" | "out_of_stock" | "expiry_warning" | "critical",
    severity: "info" | "warning" | "critical",
    message: string,
    currentQuantity: number,
    threshold: number
  ): Promise<IAlert> {
    const alert = await Alert.create({
      businessId,
      materialId,
      type,
      severity,
      message,
      currentQuantity,
      threshold,
      isResolved: false
    });

    return alert;
  }

  static async sendAlertNotifications(alert: IAlert): Promise<void> {
    const users = await User.find({
      businessId: alert.businessId,
      role: { $in: ["owner", "admin"] }
    });

    const material = await Material.findById(alert.materialId);

    if (!material) return;

    for (const user of users) {
      const channels: ("push" | "email" | "in_app")[] = ["in_app", "push"];

      if (alert.severity === "critical") {
        channels.push("email");
      }

      const notification = await Notification.create({
        userId: user._id,
        businessId: alert.businessId,
        alertId: alert._id,
        type: alert.type,
        title: alert.severity === "critical" ? "🚨 Critical Alert" : "📦 Inventory Alert",
        message: alert.message,
        data: {
          materialId: material._id.toString(),
          materialName: material.name,
          currentQuantity: alert.currentQuantity,
          threshold: alert.threshold,
          unit: material.unit
        },
        channels,
        sentVia: ["in_app"]
      });

      if (channels.includes("push")) {
        await NotificationService.sendPushNotification(user._id, notification);
      }

      if (channels.includes("email")) {
        await NotificationService.sendEmailNotification(user, notification);
      }
    }
  }

  static async checkAllThresholds(): Promise<void> {
    const materials = await Material.find({});

    for (const material of materials) {
      try {
        await this.checkMaterialThreshold(
          material._id,
          material.businessId,
          material.quantity
        );
      } catch (err) {
        console.error(`Failed to check threshold for material ${material._id}:`, err);
      }
    }
  }

  static async checkExpiringMaterials(): Promise<void> {
    const warningDays = 7;
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);

    const expiringMaterials = await Material.find({
      expiryDate: {
        $lte: warningDate,
        $gte: new Date()
      }
    });

    for (const material of expiringMaterials) {
      const existingAlert = await Alert.findOne({
        materialId: material._id,
        type: "expiry_warning",
        isResolved: false
      });

      if (!existingAlert) {
        const daysUntilExpiry = Math.ceil(
          (material.expiryDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const alert = await this.createAlert(
          material.businessId,
          material._id,
          "expiry_warning",
          daysUntilExpiry <= 2 ? "critical" : "warning",
          `${material.name} expires in ${daysUntilExpiry} day(s)`,
          material.quantity,
          0
        );

        await this.sendAlertNotifications(alert);
      }
    }
  }

  static async getBusinessAlerts(
    businessId: mongoose.Types.ObjectId,
    includeResolved: boolean = false
  ): Promise<IAlert[]> {
    const filter: any = { businessId };

    if (!includeResolved) {
      filter.isResolved = false;
    }

    const alerts = await Alert.find(filter)
      .populate("materialId", "name sku quantity unit")
      .sort({ createdAt: -1 });

    return alerts;
  }

  static async resolveAlert(alertId: mongoose.Types.ObjectId): Promise<IAlert | null> {
    const alert = await Alert.findById(alertId);

    if (!alert) return null;

    alert.isResolved = true;
    alert.resolvedAt = new Date();
    await alert.save();

    return alert;
  }
}
