import express from "express"
import { body } from "express-validator"
import { validate } from "../middleware/validate.js"
import { protect, optionalAuth } from "../middleware/auth.js"
import {
  createRoom,
  getRoomByCode,
  getRoomMessages,
  getMyRooms,
  deleteRoom,
  updateRoom,
  verifyRoomAccess,
} from "../controllers/room.controller.js"

const router = express.Router()

// Validation rules
const createRoomValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Room name is required")
    .isLength({ max: 100 })
    .withMessage("Room name cannot exceed 100 characters"),
  body("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
  body("lifetime").isInt({ min: 1, max: 6 }).withMessage("Lifetime must be between 1 and 6 hours"),
]

// Validation rules for room verification
const verifyRoomValidation = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Room code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Room code must be 6 characters"),
]

// Routes
router.post("/", protect, createRoomValidation, validate, createRoom)
router.post("/:roomId/verify", verifyRoomValidation, validate, verifyRoomAccess)
router.get("/my/created", protect, getMyRooms)
router.get("/:code", optionalAuth, getRoomByCode)
router.get("/:code/messages", optionalAuth, getRoomMessages)
router.delete("/:code", protect, deleteRoom)
router.patch("/:code", protect, updateRoom)

export default router
