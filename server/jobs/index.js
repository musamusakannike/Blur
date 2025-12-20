import cron from "node-cron"
import { cleanupExpiredRooms, cleanupExpiredPortals, cleanupInactiveParticipants } from "../services/cleanup.service.js"
import logger from "../config/logger.js"

/**
 * Start all cron jobs
 */
export const startCronJobs = () => {
  logger.info("Starting cron jobs...")

  // Clean up expired rooms every 12 hours (at 00:00 and 12:00)
  cron.schedule("0 0,12 * * *", async () => {
    logger.info("Running scheduled room cleanup job...")
    try {
      const result = await cleanupExpiredRooms()
      logger.info(`Room cleanup job completed: ${JSON.stringify(result)}`)
    } catch (error) {
      logger.error(`Room cleanup job failed: ${error.message}`)
    }
  })

  // Clean up expired portals every 48 hours (at 02:00 every 2 days)
  cron.schedule("0 2 */2 * *", async () => {
    logger.info("Running scheduled portal cleanup job...")
    try {
      const result = await cleanupExpiredPortals()
      logger.info(`Portal cleanup job completed: ${JSON.stringify(result)}`)
    } catch (error) {
      logger.error(`Portal cleanup job failed: ${error.message}`)
    }
  })

  // Clean up inactive participants every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    logger.info("Running scheduled participant cleanup job...")
    try {
      const result = await cleanupInactiveParticipants()
      logger.info(`Participant cleanup job completed: ${JSON.stringify(result)}`)
    } catch (error) {
      logger.error(`Participant cleanup job failed: ${error.message}`)
    }
  })

  logger.info("All cron jobs scheduled successfully")
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export const stopCronJobs = () => {
  cron.getTasks().forEach((task) => task.stop())
  logger.info("All cron jobs stopped")
}
