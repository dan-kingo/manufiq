import { Request, Response } from "express";
import { User } from "../models/User.js";
import { ReportService } from "../services/report.service.js";

export class ReportController {
  static async getSummaryReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const summary = await ReportService.generateSummaryReport(
        user.businessId,
        start,
        end
      );

      return res.json(summary);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate summary report" });
    }
  }

  static async getMaterialUsageReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate, materialId } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const report = await ReportService.generateMaterialUsageReport(
        user.businessId,
        start,
        end,
        materialId as string | undefined
      );

      return res.json(report);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate material usage report" });
    }
  }

  static async getTeamProductivityReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      if (user.role !== "owner") {
        return res.status(403).json({ error: "Only owners can view team productivity" });
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const report = await ReportService.generateTeamProductivityReport(
        user.businessId,
        start,
        end
      );

      return res.json(report);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate team productivity report" });
    }
  }

  static async getProductionTrends(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { period, groupBy } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const validPeriods = ["7d", "30d", "90d", "1y"];
      const selectedPeriod = period && validPeriods.includes(period as string)
        ? (period as string)
        : "30d";

      const validGroupings = ["day", "week", "month"];
      const selectedGrouping = groupBy && validGroupings.includes(groupBy as string)
        ? (groupBy as string)
        : "day";

      const trends = await ReportService.generateProductionTrends(
        user.businessId,
        selectedPeriod,
        selectedGrouping
      );

      return res.json(trends);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate production trends" });
    }
  }

  static async exportReportPDF(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { reportType, startDate, endDate } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const validTypes = ["summary", "material_usage", "team_productivity"];
      if (!reportType || !validTypes.includes(reportType as string)) {
        return res.status(400).json({ error: "Invalid report type" });
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const pdfBuffer = await ReportService.exportReportToPDF(
        user.businessId,
        reportType as string,
        start,
        end
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=report-${reportType}-${Date.now()}.pdf`
      );

      return res.send(pdfBuffer);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to export report as PDF" });
    }
  }

  static async exportReportCSV(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { reportType, startDate, endDate } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const validTypes = ["summary", "material_usage", "team_productivity", "orders"];
      if (!reportType || !validTypes.includes(reportType as string)) {
        return res.status(400).json({ error: "Invalid report type" });
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const csvData = await ReportService.exportReportToCSV(
        user.businessId,
        reportType as string,
        start,
        end
      );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=report-${reportType}-${Date.now()}.csv`
      );

      return res.send(csvData);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to export report as CSV" });
    }
  }

  static async getHistoricalData(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { dataType, startDate, endDate, limit } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const validTypes = ["orders", "materials", "inventory_events"];
      if (!dataType || !validTypes.includes(dataType as string)) {
        return res.status(400).json({ error: "Invalid data type" });
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const limitNum = limit ? parseInt(limit as string, 10) : 100;

      const data = await ReportService.getHistoricalData(
        user.businessId,
        dataType as string,
        start,
        end,
        limitNum
      );

      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch historical data" });
    }
  }
}
