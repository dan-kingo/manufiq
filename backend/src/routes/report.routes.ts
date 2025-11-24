import { Router } from "express";
import { ReportController } from "../controllers/report.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/summary", auth(), ReportController.getSummaryReport);
router.get("/material-usage", auth(), ReportController.getMaterialUsageReport);
router.get("/team-productivity", auth(), ReportController.getTeamProductivityReport);
router.get("/production-trends", auth(), ReportController.getProductionTrends);
router.get("/export/pdf", auth(), ReportController.exportReportPDF);
router.get("/export/csv", auth(), ReportController.exportReportCSV);
router.get("/historical", auth(), ReportController.getHistoricalData);

export default router;
