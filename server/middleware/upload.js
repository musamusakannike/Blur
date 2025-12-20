import multer from "multer"
import path from "path"

// Memory storage for processing before upload
const storage = multer.memoryStorage()

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImages = /jpeg|jpg|png|gif|webp/
  const allowedVideos = /mp4|mov|avi|mkv|webm/
  const allowedAudios = /mp3|wav|ogg|m4a|aac/

  const extname = path.extname(file.originalname).toLowerCase().slice(1)
  const mimetype = file.mimetype

  const isImage = allowedImages.test(extname) && mimetype.startsWith("image/")
  const isVideo = allowedVideos.test(extname) && mimetype.startsWith("video/")
  const isAudio = allowedAudios.test(extname) && mimetype.startsWith("audio/")

  if (isImage || isVideo || isAudio) {
    cb(null, true)
  } else {
    cb(new Error("Invalid file type. Only images, videos, and audio files are allowed."), false)
  }
}

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
})

// Error handler for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 50MB",
      })
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }

  next()
}
