import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./configs/db.js";
import { SchedulerService } from "./services/scheduler.service.js";

const PORT = process.env.PORT ?? 5000;
const URI = process.env.MONGO_URI;
async function start() {
  try {
    await connectDB(URI);

    SchedulerService.startScheduledTasks();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  console.log("SIGTERM received, stopping scheduled tasks...");
  SchedulerService.stopScheduledTasks();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, stopping scheduled tasks...");
  SchedulerService.stopScheduledTasks();
  process.exit(0);
});

start();
