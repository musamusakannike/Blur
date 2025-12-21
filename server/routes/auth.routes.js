import express from "express"
import { body } from "express-validator"
import { validate } from "../middleware/validate.js"
import { protect } from "../middleware/auth.js"
import {
  register,
  login,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  googleLogin,
} from "../controllers/auth.controller.js"

const router = express.Router()

// Validation rules
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
]

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

const updateProfileValidation = [
  body("displayName").optional().trim().isLength({ max: 50 }).withMessage("Display name cannot exceed 50 characters"),
  body("bio").optional().trim().isLength({ max: 200 }).withMessage("Bio cannot exceed 200 characters"),
]

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
]

// Routes
router.post("/register", registerValidation, validate, register)
router.post("/login", loginValidation, validate, login)
router.post("/google", googleLogin)
router.get("/me", protect, getMe)
router.post("/verify-email/:token", verifyEmail)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)
router.put("/update-profile", protect, updateProfileValidation, validate, updateProfile)
router.put("/change-password", protect, changePasswordValidation, validate, changePassword)

export default router
