import { uploadToCloudinary, deleteFromCloudinary, deleteManyFromCloudinary } from "../config/cloudinary.js"
import { uploadToR2, deleteFromR2, deleteManyFromR2 } from "../config/r2.js"
import logger from "../config/logger.js"

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "cloudinary"

/**
 * Upload file to configured storage provider
 */
export const uploadToStorage = async (file, folder = "blur") => {
  if (STORAGE_PROVIDER === "r2") {
    const result = await uploadToR2(file, folder)
    return result.url
  }

  // Default to Cloudinary
  const result = await uploadToCloudinary(file, folder)
  return result.url
}

/**
 * Upload file and return full metadata
 */
export const uploadToStorageWithMetadata = async (file, folder = "blur") => {
  if (STORAGE_PROVIDER === "r2") {
    return await uploadToR2(file, folder)
  }

  return await uploadToCloudinary(file, folder)
}

/**
 * Delete file from storage
 */
export const deleteFromStorage = async (url, publicId = null) => {
  try {
    if (STORAGE_PROVIDER === "r2" && publicId) {
      await deleteFromR2(publicId)
    } else if (publicId) {
      // Extract resource type from URL or publicId
      const resourceType = getResourceType(url)
      await deleteFromCloudinary(publicId, resourceType)
    } else {
      logger.warn(`Cannot delete file: missing publicId for ${url}`)
    }
  } catch (error) {
    logger.error(`Storage delete error: ${error.message}`)
  }
}

/**
 * Delete multiple files from storage
 */
export const deleteManyFromStorage = async (files) => {
  try {
    if (!files || files.length === 0) return

    const publicIds = files.map((f) => f.publicId || f.mediaPublicId).filter(Boolean)

    if (publicIds.length === 0) return

    if (STORAGE_PROVIDER === "r2") {
      await deleteManyFromR2(publicIds)
    } else {
      // Group by resource type for Cloudinary
      const imageIds = []
      const videoIds = []
      const audioIds = []

      files.forEach((file) => {
        const type = file.type || getResourceType(file.url || file.mediaUrl)
        const id = file.publicId || file.mediaPublicId

        if (!id) return

        if (type === "video") videoIds.push(id)
        else if (type === "audio") audioIds.push(id)
        else imageIds.push(id)
      })

      if (imageIds.length > 0) await deleteManyFromCloudinary(imageIds, "image")
      if (videoIds.length > 0) await deleteManyFromCloudinary(videoIds, "video")
      if (audioIds.length > 0) await deleteManyFromCloudinary(audioIds, "video") // Audio uses 'video' type in Cloudinary
    }

    logger.info(`Deleted ${publicIds.length} files from storage`)
  } catch (error) {
    logger.error(`Bulk storage delete error: ${error.message}`)
  }
}

/**
 * Get resource type from URL or file type
 */
function getResourceType(url) {
  if (!url) return "image"

  if (url.includes("/video/") || url.match(/\.(mp4|mov|avi|mkv)$/i)) {
    return "video"
  }
  if (url.includes("/raw/") || url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
    return "video" // Cloudinary uses 'video' type for audio
  }

  return "image"
}
