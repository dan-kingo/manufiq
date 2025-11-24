import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js"
import { errorHandler } from "./middlewares/error.middleware.js";
import businessRoutes from "./routes/business.routes.js";
import ownerRoutes from "./routes/owner.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import materialRoutes from "./routes/material.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import syncRoutes from "./routes/sync.routes.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use ("/", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/orders", orderRoutes);
// Error handler (should be last)
app.use(errorHandler);

export default app;
