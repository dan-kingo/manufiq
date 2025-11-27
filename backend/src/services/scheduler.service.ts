import { AlertService } from "./alert.service.js";

export class SchedulerService {
  private static checkInterval: NodeJS.Timeout | null = null;

  static startScheduledTasks(): void {
    console.log("Starting scheduled tasks...");

    this.checkInterval = setInterval(async () => {
      try {
        console.log("Running scheduled threshold check...");
        await AlertService.checkAllThresholds();
        await AlertService.checkExpiringMaterials();
      } catch (error) {
        console.error("Error in scheduled threshold check:", error);
      }
    }, 5 * 60 * 1000);

    setTimeout(async () => {
      try {
        console.log("Running initial threshold check...");
        await AlertService.checkAllThresholds();
        await AlertService.checkExpiringMaterials();
      } catch (error) {
        console.error("Error in initial threshold check:", error);
      }
    }, 5000);
  }

  static stopScheduledTasks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("Scheduled tasks stopped");
    }
  }
}
