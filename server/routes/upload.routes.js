import express from "express"
import { optionalAuth } from "../middleware/auth.js"
import { upload, handleMulterError } from "../middleware/upload.js"
import { uploadMedia, uploadMultipleMedia } from "../controllers/upload.controller.js"

const router = express.Router()

// Upload single file
router.post("/", optionalAuth, upload.single("file"), handleMulterError, uploadMedia)

// Upload multiple files
router.post("/multiple", optionalAuth, upload.array("files", 10), handleMulterError, uploadMultipleMedia)

export default router
