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

// Routes
router.post("/", protect, createRoomValidation, validate, createRoom)
router.get("/my/created", protect, getMyRooms)
router.get("/:code", optionalAuth, getRoomByCode)
router.get("/:code/messages", optionalAuth, getRoomMessages)
router.delete("/:code", protect, deleteRoom)
router.patch("/:code", protect, updateRoom)

export default router
