import express from "express"
import { body } from "express-validator"
import { validate } from "../middleware/validate.js"
import { protect } from "../middleware/auth.js"
import {
  createPortal,
  getPortalByCode,
  submitPortalMessage,
  getPortalMessages,
  markMessageAsRead,
  markAllAsRead,
  getMyPortals,
  deletePortal,
  updatePortal,
  deletePortalMessage,
} from "../controllers/portal.controller.js"

const router = express.Router()

// Validation rules
const createPortalValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Portal name is required")
    .isLength({ max: 100 })
    .withMessage("Portal name cannot exceed 100 characters"),
  body("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
  body("lifetime").isInt({ min: 1, max: 24 }).withMessage("Lifetime must be between 1 and 24 hours"),
]

const submitMessageValidation = [
  body("content").optional().trim(),
  body("type").optional().isIn(["text", "image", "video", "audio"]),
]

// Routes
router.post("/", protect, createPortalValidation, validate, createPortal)
router.get("/my/created", protect, getMyPortals)
router.get("/:code", getPortalByCode)
router.post("/:code/messages", submitMessageValidation, validate, submitPortalMessage)
router.get("/:code/messages", protect, getPortalMessages)
router.patch("/:code/messages/:messageId/read", protect, markMessageAsRead)
router.patch("/:code/messages/read-all", protect, markAllAsRead)
router.delete("/:code/messages/:messageId", protect, deletePortalMessage)
router.delete("/:code", protect, deletePortal)
router.patch("/:code", protect, updatePortal)

export default router
