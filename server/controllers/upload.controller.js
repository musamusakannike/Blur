import sharp from "sharp"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadToStorageWithMetadata } from "../utils/storage.js"
import logger from "../config/logger.js"

/**
 * @desc    Upload media file
 * @route   POST /api/upload
 * @access  Public (with optional auth)
 */
export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload a file",
    })
  }

  const { type } = req.query // image, video, audio

  let processedFile = req.file

  // Compress images using Sharp
  if (type === "image" || req.file.mimetype.startsWith("image/")) {
    try {
      const compressedBuffer = await sharp(req.file.buffer)
        .resize(2000, 2000, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer()

      processedFile = {
        ...req.file,
        buffer: compressedBuffer,
        size: compressedBuffer.length,
      }

      logger.info(`Image compressed: ${req.file.originalname}`)
    } catch (error) {
      logger.error(`Image compression error: ${error.message}`)
      // Continue with original file if compression fails
    }
  }

  // Upload to storage
  const folder = type || "media"
  const result = await uploadToStorageWithMetadata(processedFile, folder)

  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    data: {
      url: result.url,
      publicId: result.publicId,
      size: result.size,
      format: result.format,
      type: result.resourceType,
    },
  })
})

/**
 * @desc    Upload multiple media files
 * @route   POST /api/upload/multiple
 * @access  Public (with optional auth)
 */
export const uploadMultipleMedia = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please upload at least one file",
    })
  }

  const uploadPromises = req.files.map(async (file) => {
    let processedFile = file

    // Compress images
    if (file.mimetype.startsWith("image/")) {
      try {
        const compressedBuffer = await sharp(file.buffer)
          .resize(2000, 2000, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toBuffer()

        processedFile = {
          ...file,
          buffer: compressedBuffer,
          size: compressedBuffer.length,
        }
      } catch (error) {
        logger.error(`Image compression error: ${error.message}`)
      }
    }

    return await uploadToStorageWithMetadata(processedFile, "media")
  })

  const results = await Promise.all(uploadPromises)

  res.status(200).json({
    success: true,
    message: `${results.length} files uploaded successfully`,
    data: results.map((result) => ({
      url: result.url,
      publicId: result.publicId,
      size: result.size,
      format: result.format,
      type: result.resourceType,
    })),
  })
})
