import { Request, Response } from "express";
import { Order } from "../models/Order.js";
import { OrderHistory } from "../models/OrderHistory.js";
import { Material } from "../models/Material.js";
import { User } from "../models/User.js";

export class OrderController {
  static async createOrder(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const {
        customerName,
        customerContact,
        items,
        dueDate,
        notes,
        assignedTo
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "At least one item is required" });
      }

      if (!dueDate) {
        return res.status(400).json({ error: "Due date is required" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const businessId = user.businessId;

      const validatedItems = [];
      for (const item of items) {
        if (!item.materialId || !item.quantity) {
          return res.status(400).json({ error: "Each item must have materialId and quantity" });
        }

        const material = await Material.findOne({
          _id: item.materialId,
          businessId
        });

        if (!material) {
          return res.status(404).json({ error: `Material ${item.materialId} not found` });
        }

        if (material.quantity < item.quantity) {
          return res.status(400).json({
            error: "Insufficient stock",
            details: `Material "${material.name}" has insufficient stock. Available: ${material.quantity} ${material.unit}, Required: ${item.quantity} ${material.unit}`
          });
        }

        validatedItems.push({
          materialId: material._id,
          materialName: material.name,
          quantity: item.quantity,
          unit: material.unit
        });
      }

      if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
        const staffMembers = await User.find({
          _id: { $in: assignedTo },
          businessId,
          role: "staff"
        });

        if (staffMembers.length !== assignedTo.length) {
          return res.status(400).json({ error: "Some assigned staff members not found" });
        }
      }

      const orderCount = await Order.countDocuments({ businessId });
      const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

      const order = await Order.create({
        businessId,
        orderNumber,
        customerName,
        customerContact,
        items: validatedItems,
        dueDate: new Date(dueDate),
        status: "not_started",
        assignedTo: assignedTo || [],
        notes,
        createdBy: userId
      });

      await OrderHistory.create({
        orderId: order._id,
        businessId,
        userId,
        action: "created",
        newStatus: "not_started",
        newData: order.toObject()
      });

      const populatedOrder = await Order.findById(order._id)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email");

      return res.status(201).json({
        message: "Order created successfully",
        order: populatedOrder
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to create order" });
    }
  }

  static async listOrders(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { status, assignedToMe, dueDate, limit, offset } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const filter: any = { businessId: user.businessId };

      if (status && status !== "all") {
        filter.status = status;
      }

      if (assignedToMe === "true") {
        filter.assignedTo = userId;
      }

      if (dueDate) {
        const targetDate = new Date(dueDate as string);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.dueDate = {
          $gte: targetDate,
          $lt: nextDay
        };
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 50;
      const offsetNum = offset ? parseInt(offset as string, 10) : 0;

      const orders = await Order.find(filter)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(offsetNum);

      const total = await Order.countDocuments(filter);

      return res.json({
        orders,
        total,
        limit: limitNum,
        offset: offsetNum
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to list orders" });
    }
  }

  static async getOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const order = await Order.findOne({
        _id: id,
        businessId: user.businessId
      })
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .populate("items.materialId", "name sku category");

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.json(order);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch order" });
    }
  }

  static async updateOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const {
        customerName,
        customerContact,
        items,
        dueDate,
        notes
      } = req.body;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const order = await Order.findOne({
        _id: id,
        businessId: user.businessId
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status === "cancelled") {
        return res.status(400).json({ error: "Cannot update cancelled order" });
      }

      if (order.status === "delivered") {
        return res.status(400).json({ error: "Cannot update delivered order" });
      }

      const previousData = order.toObject();

      if (customerName !== undefined) order.customerName = customerName;
      if (customerContact !== undefined) order.customerContact = customerContact;
      if (dueDate !== undefined) order.dueDate = new Date(dueDate);
      if (notes !== undefined) order.notes = notes;

      if (items && Array.isArray(items) && items.length > 0) {
        const validatedItems = [];
        for (const item of items) {
          if (!item.materialId || !item.quantity) {
            return res.status(400).json({ error: "Each item must have materialId and quantity" });
          }

          const material = await Material.findOne({
            _id: item.materialId,
            businessId: user.businessId
          });

          if (!material) {
            return res.status(404).json({ error: `Material ${item.materialId} not found` });
          }

          if (material.quantity < item.quantity) {
            return res.status(400).json({
              error: "Insufficient stock",
              details: `Material "${material.name}" has insufficient stock. Available: ${material.quantity} ${material.unit}, Required: ${item.quantity} ${material.unit}`
            });
          }

          validatedItems.push({
            materialId: material._id,
            materialName: material.name,
            quantity: item.quantity,
            unit: material.unit
          });
        }
        order.items = validatedItems;
      }

      await order.save();

      await OrderHistory.create({
        orderId: order._id,
        businessId: user.businessId,
        userId,
        action: "edited",
        previousData,
        newData: order.toObject()
      });

      const populatedOrder = await Order.findById(order._id)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email");

      return res.json({
        message: "Order updated successfully",
        order: populatedOrder
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to update order" });
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { status } = req.body;

      const validStatuses = ["not_started", "in_progress", "halfway", "completed"];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status. Use /progress/:orderId/deliver endpoint to mark as delivered" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const order = await Order.findOne({
        _id: id,
        businessId: user.businessId
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status === "cancelled") {
        return res.status(400).json({ error: "Cannot update status of cancelled order" });
      }

      if (order.status === "delivered") {
        return res.status(400).json({ error: "Cannot update status of delivered order" });
      }

      const previousStatus = order.status;

      if (previousStatus === status) {
        return res.status(400).json({ error: "Order already has this status" });
      }

      order.status = status;

      if (status === "completed" && !order.completedAt) {
        order.completedAt = new Date();
      }

      await order.save();

      await OrderHistory.create({
        orderId: order._id,
        businessId: user.businessId,
        userId,
        action: "status_changed",
        previousStatus,
        newStatus: status
      });

      const populatedOrder = await Order.findById(order._id)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email");

      return res.json({
        message: "Order status updated successfully",
        order: populatedOrder
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to update order status" });
    }
  }

  static async assignStaff(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { staffIds } = req.body;

      if (!staffIds || !Array.isArray(staffIds)) {
        return res.status(400).json({ error: "staffIds array is required" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      if (user.role !== "owner") {
        return res.status(403).json({ error: "Only owners can assign staff" });
      }

      const order = await Order.findOne({
        _id: id,
        businessId: user.businessId
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status === "cancelled") {
        return res.status(400).json({ error: "Cannot assign staff to cancelled order" });
      }

      if (staffIds.length > 0) {
        const uniqueStaffIds = [...new Set(staffIds)];
        const staffMembers = await User.find({
          _id: { $in: uniqueStaffIds },
          businessId: user.businessId,
          role: "staff"
        });

        if (staffMembers.length !== uniqueStaffIds.length) {
          return res.status(400).json({ error: "Some staff members not found or invalid" });
        }

        order.assignedTo = uniqueStaffIds.map(id => id);
      } else {
        order.assignedTo = [];
      }

      await order.save();

      await OrderHistory.create({
        orderId: order._id,
        businessId: user.businessId,
        userId,
        action: "assigned",
        newData: { assignedTo: order.assignedTo }
      });

      const populatedOrder = await Order.findById(order._id)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email");

      return res.json({
        message: "Staff assigned successfully",
        order: populatedOrder
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to assign staff" });
    }
  }

  static async cancelOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      if (user.role !== "owner") {
        return res.status(403).json({ error: "Only owners can cancel orders" });
      }

      const order = await Order.findOne({
        _id: id,
        businessId: user.businessId
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status === "cancelled") {
        return res.status(400).json({ error: "Order already cancelled" });
      }

      if (order.status === "delivered") {
        return res.status(400).json({ error: "Cannot cancel delivered order" });
      }

      const previousStatus = order.status;

      order.status = "cancelled";
      order.cancelledBy = userId as any;
      order.cancelledAt = new Date();
      order.cancellationReason = reason;

      await order.save();

      await OrderHistory.create({
        orderId: order._id,
        businessId: user.businessId,
        userId,
        action: "cancelled",
        previousStatus,
        newStatus: "cancelled",
        notes: reason
      });

      const populatedOrder = await Order.findById(order._id)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .populate("cancelledBy", "name email");

      return res.json({
        message: "Order cancelled successfully",
        order: populatedOrder
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to cancel order" });
    }
  }

  static async getOrderHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const order = await Order.findOne({
        _id: id,
        businessId: user.businessId
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const history = await OrderHistory.find({ orderId: id })
        .populate("userId", "name email")
        .sort({ timestamp: -1 });

      return res.json(history);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch order history" });
    }
  }

  static async getOrderStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const businessId = user.businessId;

      const stats = await Order.aggregate([
        { $match: { businessId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      const statusCounts = {
        not_started: 0,
        in_progress: 0,
        halfway: 0,
        completed: 0,
        delivered: 0,
        cancelled: 0
      };

      stats.forEach((stat) => {
        if (stat._id in statusCounts) {
          statusCounts[stat._id as keyof typeof statusCounts] = stat.count;
        }
      });

      const totalOrders = await Order.countDocuments({ businessId });
      const overdueOrders = await Order.countDocuments({
        businessId,
        dueDate: { $lt: new Date() },
        status: { $nin: ["completed", "delivered", "cancelled"] }
      });

      return res.json({
        statusCounts,
        totalOrders,
        overdueOrders
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch order stats" });
    }
  }
}
