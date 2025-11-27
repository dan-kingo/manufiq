import { Request, Response } from "express";
import { ProductionStep } from "../models/ProductionStep.js";
import { Order } from "../models/Order.js";
import { OrderHistory } from "../models/OrderHistory.js";
import { User } from "../models/User.js";
import { ReceiptService } from "../services/receipt.service.js";
import mongoose from "mongoose";

export class ProgressController {
  static async addProductionSteps(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;
      const { steps } = req.body;

      if (!steps || !Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ error: "Steps array is required" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const order = await Order.findOne({
        _id: orderId,
        businessId: user.businessId
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status === "cancelled" || order.status === "delivered") {
        return res.status(400).json({ error: "Cannot add steps to cancelled or delivered order" });
      }

      const existingSteps = await ProductionStep.find({ orderId: order._id }).sort({ stepNumber: 1 });
      const nextStepNumber = existingSteps.length > 0 ? existingSteps[existingSteps.length - 1].stepNumber + 1 : 1;

      const createdSteps = [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const productionStep = await ProductionStep.create({
          orderId: order._id,
          businessId: user.businessId,
          stepNumber: nextStepNumber + i,
          description: step.description || `Step ${nextStepNumber + i}`,
          isCompleted: step.isCompleted || false,
          notes: step.notes || ""
        });
        createdSteps.push(productionStep);
      }

      await this.updateOrderProgress(order._id);

      await OrderHistory.create({
        orderId: order._id,
        businessId: user.businessId,
        userId,
        action: "edited",
        notes: `Added ${createdSteps.length} production step(s)`
      });

      return res.status(201).json({
        message: "Production steps added successfully",
        steps: createdSteps
      });
    } catch (err) {
      console.error("Error adding production steps:", err);
      return res.status(500).json({
        error: "Failed to add production steps",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    }
  }

  static async getProductionSteps(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const order = await Order.findOne({
        _id: orderId,
        businessId: user.businessId
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const steps = await ProductionStep.find({ orderId: order._id })
        .populate("completedBy", "name email")
        .sort({ stepNumber: 1 });

      const totalSteps = steps.length;
      const completedSteps = steps.filter(s => s.isCompleted).length;
      const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      return res.json({
        steps,
        totalSteps,
        completedSteps,
        completionPercentage
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch production steps" });
    }
  }

  static async updateProductionStep(req: Request, res: Response) {
    try {
      const { stepId } = req.params;
      const userId = req.user?.id;
      const { isCompleted, notes } = req.body;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const step = await ProductionStep.findOne({
        _id: stepId,
        businessId: user.businessId
      });

      if (!step) {
        return res.status(404).json({ error: "Production step not found" });
      }

      const order = await Order.findById(step.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status === "cancelled" || order.status === "delivered") {
        return res.status(400).json({ error: "Cannot update steps for cancelled or delivered order" });
      }

      if (isCompleted !== undefined) {
        step.isCompleted = isCompleted;
        if (isCompleted) {
          step.completedBy = userId as any;
          step.completedAt = new Date();
        } else {
          step.completedBy = undefined;
          step.completedAt = undefined;
        }
      }

      if (notes !== undefined) {
        step.notes = notes;
      }

      await step.save();

      await this.updateOrderProgress(step.orderId);

      await OrderHistory.create({
        orderId: step.orderId,
        businessId: user.businessId,
        userId,
        action: "edited",
        notes: `Updated production step ${step.stepNumber}: ${step.description}`
      });

      return res.json({
        message: "Production step updated successfully",
        step
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to update production step" });
    }
  }

  static async deleteProductionStep(req: Request, res: Response) {
    try {
      const { stepId } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      if (user.role !== "owner") {
        return res.status(403).json({ error: "Only owners can delete production steps" });
      }

      const step = await ProductionStep.findOne({
        _id: stepId,
        businessId: user.businessId
      });

      if (!step) {
        return res.status(404).json({ error: "Production step not found" });
      }

      const orderId = step.orderId;

      await step.deleteOne();

      const remainingSteps = await ProductionStep.find({ orderId }).sort({ stepNumber: 1 });
      for (let i = 0; i < remainingSteps.length; i++) {
        remainingSteps[i].stepNumber = i + 1;
        await remainingSteps[i].save();
      }

      await this.updateOrderProgress(orderId);

      await OrderHistory.create({
        orderId,
        businessId: user.businessId,
        userId,
        action: "edited",
        notes: `Deleted production step: ${step.description}`
      });

      return res.json({
        message: "Production step deleted successfully"
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete production step" });
    }
  }

  static async markOrderDelivered(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const order = await Order.findOne({
        _id: orderId,
        businessId: user.businessId
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status === "cancelled") {
        return res.status(400).json({ error: "Cannot deliver cancelled order" });
      }

      if (order.status === "delivered") {
        return res.status(400).json({ error: "Order already delivered" });
      }

      if (order.status !== "completed") {
        return res.status(400).json({ error: "Order must be completed before marking as delivered" });
      }

      const previousStatus = order.status;
      order.status = "delivered";
      order.deliveredAt = new Date();
      order.completionPercentage = 100;

      await order.save();

      await OrderHistory.create({
        orderId: order._id,
        businessId: user.businessId,
        userId,
        action: "status_changed",
        previousStatus,
        newStatus: "delivered"
      });

      const receipt = await ReceiptService.generateReceipt(
        order._id,
        user.businessId,
        userId as any
      );

      const populatedOrder = await Order.findById(order._id)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .populate("receiptId");

      return res.json({
        message: "Order marked as delivered and receipt generated",
        order: populatedOrder,
        receipt
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to mark order as delivered" });
    }
  }

  static async getReceipt(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const receipt = await ReceiptService.getReceiptByOrderId(
        orderId as any,
        user.businessId
      );

      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      return res.json(receipt);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch receipt" });
    }
  }

  static async listReceipts(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit, offset } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 50;
      const offsetNum = offset ? parseInt(offset as string, 10) : 0;

      const result = await ReceiptService.listReceipts(
        user.businessId,
        limitNum,
        offsetNum
      );

      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to list receipts" });
    }
  }

  private static async updateOrderProgress(orderId: mongoose.Types.ObjectId) {
    const steps = await ProductionStep.find({ orderId });
    const totalSteps = steps.length;

    if (totalSteps === 0) {
      return;
    }

    const completedSteps = steps.filter(s => s.isCompleted).length;
    const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

    const order = await Order.findById(orderId);
    if (order) {
      order.completionPercentage = completionPercentage;

      if (completionPercentage === 100 && order.status !== "completed" && order.status !== "delivered") {
        order.status = "completed";
        order.completedAt = new Date();
      } else if (completionPercentage >= 50 && completionPercentage < 100 && order.status === "not_started") {
        order.status = "halfway";
      } else if (completionPercentage > 0 && completionPercentage < 50 && order.status === "not_started") {
        order.status = "in_progress";
      }

      await order.save();
    }
  }
}
