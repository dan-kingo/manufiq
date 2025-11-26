import PDFDocument from "pdfkit";
import { format } from "@fast-csv/format";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Material } from "../models/Material.js";
import { InventoryEvent } from "../models/InventoryEvent.js";
import { ProductionStep } from "../models/ProductionStep.js";
import { User } from "../models/User.js";
import { Business } from "../models/Business.js";

interface SummaryReport {
  period: {
    start?: Date;
    end: Date;
  };
  orders: {
    total: number;
    active: number;
    completed: number;
    delivered: number;
    cancelled: number;
    overdue: number;
  };
  materials: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  productivity: {
    averageCompletionTime: number;
    onTimeDeliveryRate: number;
    totalProductionSteps: number;
    completedSteps: number;
  };
}

interface MaterialUsageReport {
  period: {
    start?: Date;
    end: Date;
  };
  totalEvents: number;
  materials: Array<{
    materialId: string;
    materialName: string;
    totalAdded: number;
    totalUsed: number;
    totalSold: number;
    netChange: number;
    currentStock: number;
    unit: string;
  }>;
}

interface TeamProductivityReport {
  period: {
    start?: Date;
    end: Date;
  };
  teamMembers: Array<{
    userId: string;
    name: string;
    ordersAssigned: number;
    ordersCompleted: number;
    stepsCompleted: number;
    averageCompletionTime: number;
    onTimeRate: number;
  }>;
}

export class ReportService {
  static async generateSummaryReport(
    businessId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<SummaryReport> {
    const end = endDate || new Date();
    const start = startDate;

    const dateFilter: any = { businessId };
    if (start) {
      dateFilter.createdAt = { $gte: start, $lte: end };
    } else {
      dateFilter.createdAt = { $lte: end };
    }

    const totalOrders = await Order.countDocuments(dateFilter);

    const activeOrders = await Order.countDocuments({
      ...dateFilter,
      status: { $in: ["not_started", "in_progress", "halfway"] }
    });

    const completedOrders = await Order.countDocuments({
      ...dateFilter,
      status: "completed"
    });

    const deliveredOrders = await Order.countDocuments({
      ...dateFilter,
      status: "delivered"
    });

    const cancelledOrders = await Order.countDocuments({
      ...dateFilter,
      status: "cancelled"
    });

    const overdueOrders = await Order.countDocuments({
      businessId,
      dueDate: { $lt: new Date() },
      status: { $nin: ["completed", "delivered", "cancelled"] }
    });

    const materials = await Material.find({ businessId });
    const lowStock = materials.filter(m => m.minThreshold != null && m.quantity <= m.minThreshold).length;
    const outOfStock = materials.filter(m => m.quantity === 0).length;

    const completedOrdersData = await Order.find({
      businessId,
      status: { $in: ["completed", "delivered"] },
      completedAt: { $exists: true }
    });

    let totalCompletionTime = 0;
    let onTimeCount = 0;

    for (const order of completedOrdersData) {
      if (order.completedAt && order.createdAt) {
        const completionTime = order.completedAt.getTime() - order.createdAt.getTime();
        totalCompletionTime += completionTime;
      }

      if (order.completedAt && order.dueDate && order.completedAt <= order.dueDate) {
        onTimeCount++;
      }
    }

    const averageCompletionTime = completedOrdersData.length > 0
      ? Math.round(totalCompletionTime / completedOrdersData.length / (1000 * 60 * 60 * 24))
      : 0;

    const onTimeDeliveryRate = completedOrdersData.length > 0
      ? Math.round((onTimeCount / completedOrdersData.length) * 100)
      : 0;

    const totalProductionSteps = await ProductionStep.countDocuments({
      businessId,
      ...(start && { createdAt: { $gte: start, $lte: end } })
    });

    const completedSteps = await ProductionStep.countDocuments({
      businessId,
      isCompleted: true,
      ...(start && { createdAt: { $gte: start, $lte: end } })
    });

    return {
      period: { start, end },
      orders: {
        total: totalOrders,
        active: activeOrders,
        completed: completedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        overdue: overdueOrders
      },
      materials: {
        totalItems: materials.length,
        lowStock,
        outOfStock,
        totalValue: 0
      },
      productivity: {
        averageCompletionTime,
        onTimeDeliveryRate,
        totalProductionSteps,
        completedSteps
      }
    };
  }

  static async generateMaterialUsageReport(
    businessId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date,
    materialId?: string
  ): Promise<MaterialUsageReport> {
    const end = endDate || new Date();
    const start = startDate;

    const filter: any = { businessId };
    if (start) {
      filter.timestamp = { $gte: start, $lte: end };
    }
    if (materialId) {
      filter.materialId = materialId;
    }

    const events = await InventoryEvent.find(filter)
      .populate("materialId", "name unit quantity")
      .sort({ timestamp: -1 });

    const materialMap = new Map<string, any>();

    for (const event of events) {
      const material = event.materialId as any;
      if (!material) continue;

      const key = material._id.toString();

      if (!materialMap.has(key)) {
        materialMap.set(key, {
          materialId: key,
          materialName: material.name,
          totalAdded: 0,
          totalUsed: 0,
          totalSold: 0,
          netChange: 0,
          currentStock: material.quantity,
          unit: material.unit
        });
      }

      const item = materialMap.get(key);

      if (event.action === "added") {
        item.totalAdded += event.delta;
      } else if (event.action === "used") {
        item.totalUsed += Math.abs(event.delta);
      } else if (event.action === "sold") {
        item.totalSold += Math.abs(event.delta);
      }

      item.netChange += event.delta;
    }

    return {
      period: { start, end },
      totalEvents: events.length,
      materials: Array.from(materialMap.values())
    };
  }

  static async generateTeamProductivityReport(
    businessId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<TeamProductivityReport> {
    const end = endDate || new Date();
    const start = startDate;

    const staffMembers = await User.find({
      businessId,
      role: "staff"
    });

    const teamReport: TeamProductivityReport = {
      period: { start, end },
      teamMembers: []
    };

    for (const staff of staffMembers) {
      const orderFilter: any = {
        businessId,
        assignedTo: staff._id
      };

      if (start) {
        orderFilter.createdAt = { $gte: start, $lte: end };
      }

      const ordersAssigned = await Order.countDocuments(orderFilter);

      const ordersCompleted = await Order.countDocuments({
        ...orderFilter,
        status: { $in: ["completed", "delivered"] }
      });

      const stepsCompleted = await ProductionStep.countDocuments({
        businessId,
        completedBy: staff._id,
        isCompleted: true,
        ...(start && { completedAt: { $gte: start, $lte: end } })
      });

      const completedOrders = await Order.find({
        ...orderFilter,
        status: { $in: ["completed", "delivered"] },
        completedAt: { $exists: true }
      });

      let totalTime = 0;
      let onTimeCount = 0;

      for (const order of completedOrders) {
        if (order.completedAt && order.createdAt) {
          totalTime += order.completedAt.getTime() - order.createdAt.getTime();
        }

        if (order.completedAt && order.dueDate && order.completedAt <= order.dueDate) {
          onTimeCount++;
        }
      }

      const averageCompletionTime = completedOrders.length > 0
        ? Math.round(totalTime / completedOrders.length / (1000 * 60 * 60 * 24))
        : 0;

      const onTimeRate = completedOrders.length > 0
        ? Math.round((onTimeCount / completedOrders.length) * 100)
        : 0;

      teamReport.teamMembers.push({
        userId: staff._id.toString(),
        name: staff.name,
        ordersAssigned,
        ordersCompleted,
        stepsCompleted,
        averageCompletionTime,
        onTimeRate
      });
    }

    return teamReport;
  }

  static async generateProductionTrends(
    businessId: mongoose.Types.ObjectId,
    period: string,
    groupBy: string
  ): Promise<any> {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    let groupFormat: any;
    switch (groupBy) {
      case "day":
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "week":
        groupFormat = { $dateToString: { format: "%Y-W%V", date: "$createdAt" } };
        break;
      case "month":
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      default:
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    const orderTrends = await Order.aggregate([
      {
        $match: {
          businessId,
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalOrders: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $in: ["$status", ["completed", "delivered"]] }, 1, 0]
            }
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const materialTrends = await InventoryEvent.aggregate([
      {
        $match: {
          businessId,
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          added: {
            $sum: {
              $cond: [{ $eq: ["$action", "added"] }, "$delta", 0]
            }
          },
          used: {
            $sum: {
              $cond: [{ $eq: ["$action", "used"] }, { $abs: "$delta" }, 0]
            }
          },
          sold: {
            $sum: {
              $cond: [{ $eq: ["$action", "sold"] }, { $abs: "$delta" }, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      period: { start: startDate, end: now },
      groupBy,
      orderTrends,
      materialTrends
    };
  }

  static async exportReportToPDF(
    businessId: mongoose.Types.ObjectId,
    reportType: string,
    startDate?: Date,
    endDate?: Date
    , period?: string, groupBy?: string
  ): Promise<Buffer> {
    const business = await Business.findById(businessId);
    let reportData: any;

    switch (reportType) {
      case "summary":
        reportData = await this.generateSummaryReport(businessId, startDate, endDate);
        break;
      case "material_usage":
        reportData = await this.generateMaterialUsageReport(businessId, startDate, endDate);
        break;
      case "team_productivity":
        reportData = await this.generateTeamProductivityReport(businessId, startDate, endDate);
        break;
      case "production_trends":
        // For production trends the service expects a shorthand period (e.g. '30d') and grouping ('day')
        reportData = await this.generateProductionTrends(businessId, period || '30d', groupBy || 'day');
        break;
      default:
        throw new Error("Invalid report type");
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).text(business?.name || "Business Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text(this.getReportTitle(reportType), { align: "center", underline: true });
      doc.moveDown();

      doc.fontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`);
      if (reportData.period?.start) {
        doc.text(`Period: ${reportData.period.start.toLocaleDateString()} - ${reportData.period.end.toLocaleDateString()}`);
      } else {
        doc.text(`As of: ${reportData.period.end.toLocaleDateString()}`);
      }
      doc.moveDown();

      if (reportType === "summary") {
        this.addSummaryToPDF(doc, reportData);
      } else if (reportType === "material_usage") {
        this.addMaterialUsageToPDF(doc, reportData);
      } else if (reportType === "team_productivity") {
        this.addTeamProductivityToPDF(doc, reportData);
      } else if (reportType === "production_trends") {
        this.addProductionTrendsToPDF(doc, reportData);
      }

      doc.end();
    });
  }

  private static getReportTitle(reportType: string): string {
    const titles: Record<string, string> = {
      summary: "Summary Report",
      material_usage: "Material Usage Report",
      team_productivity: "Team Productivity Report"
      , production_trends: "Production Trends Report"
    };
    return titles[reportType] || "Report";
  }

  private static addSummaryToPDF(doc: PDFKit.PDFDocument, data: SummaryReport) {
    doc.fontSize(14).text("Orders Summary", { underline: true });
    doc.fontSize(10);
    doc.text(`Total Orders: ${data.orders.total}`);
    doc.text(`Active Orders: ${data.orders.active}`);
    doc.text(`Completed Orders: ${data.orders.completed}`);
    doc.text(`Delivered Orders: ${data.orders.delivered}`);
    doc.text(`Cancelled Orders: ${data.orders.cancelled}`);
    doc.text(`Overdue Orders: ${data.orders.overdue}`);
    doc.moveDown();

    doc.fontSize(14).text("Materials Summary", { underline: true });
    doc.fontSize(10);
    doc.text(`Total Items: ${data.materials.totalItems}`);
    doc.text(`Low Stock Items: ${data.materials.lowStock}`);
    doc.text(`Out of Stock Items: ${data.materials.outOfStock}`);
    doc.moveDown();

    doc.fontSize(14).text("Productivity Summary", { underline: true });
    doc.fontSize(10);
    doc.text(`Average Completion Time: ${data.productivity.averageCompletionTime} days`);
    doc.text(`On-Time Delivery Rate: ${data.productivity.onTimeDeliveryRate}%`);
    doc.text(`Total Production Steps: ${data.productivity.totalProductionSteps}`);
    doc.text(`Completed Steps: ${data.productivity.completedSteps}`);
  }

  private static addMaterialUsageToPDF(doc: PDFKit.PDFDocument, data: MaterialUsageReport) {
    doc.fontSize(14).text("Material Usage Summary", { underline: true });
    doc.fontSize(10);
    doc.text(`Total Events: ${data.totalEvents}`);
    doc.moveDown();

    doc.fontSize(12).text("Materials:", { underline: true });
    doc.moveDown(0.5);

    for (const material of data.materials) {
      doc.fontSize(10);
      doc.text(`${material.materialName}:`, { continued: false });
      doc.text(`  Added: ${material.totalAdded} ${material.unit}`);
      doc.text(`  Used: ${material.totalUsed} ${material.unit}`);
      doc.text(`  Sold: ${material.totalSold} ${material.unit}`);
      doc.text(`  Net Change: ${material.netChange} ${material.unit}`);
      doc.text(`  Current Stock: ${material.currentStock} ${material.unit}`);
      doc.moveDown(0.5);
    }
  }

  private static addTeamProductivityToPDF(doc: PDFKit.PDFDocument, data: TeamProductivityReport) {
    doc.fontSize(14).text("Team Productivity Summary", { underline: true });
    doc.moveDown();

    for (const member of data.teamMembers) {
      doc.fontSize(12).text(member.name, { underline: true });
      doc.fontSize(10);
      doc.text(`Orders Assigned: ${member.ordersAssigned}`);
      doc.text(`Orders Completed: ${member.ordersCompleted}`);
      doc.text(`Steps Completed: ${member.stepsCompleted}`);
      doc.text(`Average Completion Time: ${member.averageCompletionTime} days`);
      doc.text(`On-Time Rate: ${member.onTimeRate}%`);
      doc.moveDown();
    }
  }

  private static addProductionTrendsToPDF(doc: PDFKit.PDFDocument, data: any) {
    doc.fontSize(14).text("Production Trends", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text("Order Trends", { underline: true });
    doc.fontSize(10);
    if (Array.isArray(data.orderTrends) && data.orderTrends.length > 0) {
      for (const t of data.orderTrends) {
        doc.text(`${t._id}: Total=${t.totalOrders}, Completed=${t.completed}, Cancelled=${t.cancelled}`);
      }
    } else {
      doc.text("No order trend data available.");
    }

    doc.moveDown(0.5);
    doc.fontSize(12).text("Material Trends", { underline: true });
    doc.fontSize(10);
    if (Array.isArray(data.materialTrends) && data.materialTrends.length > 0) {
      for (const t of data.materialTrends) {
        doc.text(`${t._id}: Added=${t.added}, Used=${t.used}, Sold=${t.sold}`);
      }
    } else {
      doc.text("No material trend data available.");
    }
  }

  static async exportReportToCSV(
    businessId: mongoose.Types.ObjectId,
    reportType: string,
    startDate?: Date,
    endDate?: Date
    , period?: string, groupBy?: string
  ): Promise<string> {
    let data: any[] = [];

    switch (reportType) {
      case "summary":
        const summary = await this.generateSummaryReport(businessId, startDate, endDate);
        data = [
          { metric: "Total Orders", value: summary.orders.total },
          { metric: "Active Orders", value: summary.orders.active },
          { metric: "Completed Orders", value: summary.orders.completed },
          { metric: "Delivered Orders", value: summary.orders.delivered },
          { metric: "Cancelled Orders", value: summary.orders.cancelled },
          { metric: "Overdue Orders", value: summary.orders.overdue },
          { metric: "Total Materials", value: summary.materials.totalItems },
          { metric: "Low Stock Items", value: summary.materials.lowStock },
          { metric: "Out of Stock Items", value: summary.materials.outOfStock },
          { metric: "Average Completion Time (days)", value: summary.productivity.averageCompletionTime },
          { metric: "On-Time Delivery Rate (%)", value: summary.productivity.onTimeDeliveryRate },
          { metric: "Total Production Steps", value: summary.productivity.totalProductionSteps },
          { metric: "Completed Steps", value: summary.productivity.completedSteps }
        ];
        break;

      case "material_usage":
        const materialUsage = await this.generateMaterialUsageReport(businessId, startDate, endDate);
        data = materialUsage.materials.map(m => ({
          materialName: m.materialName,
          added: m.totalAdded,
          used: m.totalUsed,
          sold: m.totalSold,
          netChange: m.netChange,
          currentStock: m.currentStock,
          unit: m.unit
        }));
        break;

      case "team_productivity":
        const teamReport = await this.generateTeamProductivityReport(businessId, startDate, endDate);
        data = teamReport.teamMembers.map(m => ({
          name: m.name,
          ordersAssigned: m.ordersAssigned,
          ordersCompleted: m.ordersCompleted,
          stepsCompleted: m.stepsCompleted,
          averageCompletionTime: m.averageCompletionTime,
          onTimeRate: m.onTimeRate
        }));
        break;

      case "orders":
        const filter: any = { businessId };
        if (startDate) {
          filter.createdAt = { $gte: startDate, $lte: endDate || new Date() };
        }

        const orders = await Order.find(filter)
          .populate("createdBy", "name")
          .sort({ createdAt: -1 })
          .limit(1000);

        data = orders.map(o => ({
          orderNumber: o.orderNumber,
          customerName: o.customerName || "",
          status: o.status,
          itemCount: o.items.length,
          dueDate: o.dueDate.toISOString(),
          createdAt: o.createdAt.toISOString(),
          completedAt: o.completedAt?.toISOString() || "",
          deliveredAt: o.deliveredAt?.toISOString() || "",
          createdBy: (o.createdBy as any)?.name || ""
        }));
        break;

      case "production_trends":
        // Generate trends then create two CSV sections: orders and materials
        const trends = await this.generateProductionTrends(businessId, period || '30d', groupBy || 'day');

        // Helper to render a CSV string for a given array and headers
        const toCsv = (rows: any[], headers: string[]) => {
          return new Promise<string>((resolve, reject) => {
            const cs = format({ headers });
            const chunks: string[] = [];
            cs.on('data', (chunk) => chunks.push(chunk.toString()));
            cs.on('end', () => resolve(chunks.join('')));
            cs.on('error', reject);
            rows.forEach(r => cs.write(r));
            cs.end();
          });
        };

        const orderRows = (trends.orderTrends || []).map((t: any) => ({ date: t._id, totalOrders: t.totalOrders, completed: t.completed, cancelled: t.cancelled }));
        const materialRows = (trends.materialTrends || []).map((t: any) => ({ date: t._id, added: t.added, used: t.used, sold: t.sold }));

        const orderCsv = await toCsv(orderRows, ['date', 'totalOrders', 'completed', 'cancelled']);
        const materialCsv = await toCsv(materialRows, ['date', 'added', 'used', 'sold']);

        // Concatenate with a separator header so client can distinguish sections
        return Promise.resolve(`Order Trends\n\n${orderCsv}\n\nMaterial Trends\n\n${materialCsv}`);

      default:
        throw new Error("Invalid report type");
    }

    return new Promise((resolve, reject) => {
      const csvStream = format({ headers: true });
      const chunks: string[] = [];

      csvStream.on("data", (chunk) => chunks.push(chunk.toString()));
      csvStream.on("end", () => resolve(chunks.join("")));
      csvStream.on("error", reject);

      data.forEach((row) => csvStream.write(row));
      csvStream.end();
    });
  }

  static async getHistoricalData(
    businessId: mongoose.Types.ObjectId,
    dataType: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<any> {
    const end = endDate || new Date();
    const start = startDate;

    switch (dataType) {
      case "orders":
        const orderFilter: any = { businessId };
        if (start) {
          orderFilter.createdAt = { $gte: start, $lte: end };
        }

        const orders = await Order.find(orderFilter)
          .populate("createdBy", "name email")
          .populate("assignedTo", "name email")
          .sort({ createdAt: -1 })
          .limit(limit);

        return {
          dataType: "orders",
          period: { start, end },
          count: orders.length,
          data: orders
        };

      case "materials":
        const materials = await Material.find({ businessId })
          .sort({ updatedAt: -1 })
          .limit(limit);

        return {
          dataType: "materials",
          count: materials.length,
          data: materials
        };

      case "inventory_events":
        const eventFilter: any = { businessId };
        if (start) {
          eventFilter.timestamp = { $gte: start, $lte: end };
        }

        const events = await InventoryEvent.find(eventFilter)
          .populate("materialId", "name sku unit")
          .populate("userId", "name email")
          .sort({ timestamp: -1 })
          .limit(limit);

        return {
          dataType: "inventory_events",
          period: { start, end },
          count: events.length,
          data: events
        };

      default:
        throw new Error("Invalid data type");
    }
  }
}
