import cron from "node-cron"
import { updateTrimesterService } from "../service/pregnancy.service"

/**
 * Runs automatically in background
 * Schedule: EVERY DAY at 12 AM
 */
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Running pregnancy auto-update job...")
  await updateTrimesterService()
})