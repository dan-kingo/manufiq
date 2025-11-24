import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js"
import { errorHandler } from "./middlewares/error.middleware.js";

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

// Error handler (should be last)
app.use(errorHandler);

export default app;
