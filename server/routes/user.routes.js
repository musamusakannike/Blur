import express from "express"
import { protect } from "../middleware/auth.js"
import { getUserProfile, updateAvatar } from "../controllers/user.controller.js"
import { upload } from "../middleware/upload.js"

const router = express.Router()

router.get("/:username", getUserProfile)
router.post("/avatar", protect, upload.single("avatar"), updateAvatar)

export default router
