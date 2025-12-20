import express from "express"
import { protect } from "../middleware/auth.js"
import {
  getSystemStats,
  manualRoomCleanup,
  manualPortalCleanup,
  manualParticipantCleanup,
  getCleanupStatistics,
} from "../controllers/admin.controller.js"

const router = express.Router()

// Note: Add admin-only middleware here if needed
// Example: router.use(protect, isAdmin)

router.get("/stats", protect, getSystemStats)
router.get("/cleanup/stats", protect, getCleanupStatistics)
router.post("/cleanup/rooms", protect, manualRoomCleanup)
router.post("/cleanup/portals", protect, manualPortalCleanup)
router.post("/cleanup/participants", protect, manualParticipantCleanup)

export default router
